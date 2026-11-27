import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18nService } from '../i18n/i18n.service';

export interface PageSeo {
  title: string;
  description: string;
  /** adresse absolue de la page */
  canonical: string;
  /** langue → adresse absolue (x-default : l'italien) */
  alternates: Record<string, string>;
  image?: string;
  noindex?: boolean;
}

/**
 * Titre et balises pour les moteurs de recherche et le partage (canonical, hreflang, Open Graph).
 * Écrites au pré-rendu dans le HTML de chaque page ; `clear()` rend la page à son état de départ.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(I18nService);

  set(p: PageSeo): void {
    this.clear();
    this.title.setTitle(`${p.title} · Ododino`);
    this.meta.updateTag({ name: 'description', content: p.description });
    this.meta.updateTag({ property: 'og:title', content: `${p.title} · Ododino` });
    this.meta.updateTag({ property: 'og:description', content: p.description });
    if (p.image) this.meta.updateTag({ property: 'og:image', content: p.image });
    if (p.noindex) this.meta.updateTag({ name: 'robots', content: 'noindex' });
    this.link({ rel: 'canonical', href: p.canonical });
    for (const [lang, href] of Object.entries(p.alternates)) this.link({ rel: 'alternate', hreflang: lang, href });
    if (p.alternates['it']) this.link({ rel: 'alternate', hreflang: 'x-default', href: p.alternates['it'] });
  }

  clear(): void {
    // valeurs de la carte (src/index.html), pas celles lues au chargement : la première page peut être une fiche
    this.title.setTitle('Ododino · Valli del Natisone');
    this.meta.updateTag({ name: 'description', content: this.i18n.t('metaDesc') });
    for (const sel of ["property='og:title'", "property='og:description'", "property='og:image'", "name='robots'"]) {
      this.meta.removeTag(sel);
    }
    // y compris celles écrites au pré-rendu, que ce service n'a pas créées dans le navigateur
    this.doc.head.querySelectorAll('link[rel=canonical], link[rel=alternate][hreflang]').forEach((l) => l.remove());
  }

  private link(attrs: Record<string, string>): void {
    const l = this.doc.createElement('link');
    for (const [k, v] of Object.entries(attrs)) l.setAttribute(k, v);
    this.doc.head.appendChild(l);
  }
}
