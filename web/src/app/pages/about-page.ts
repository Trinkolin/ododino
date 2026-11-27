import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FICHES } from '../cards/fiche';
import { I18nService, LANGS } from '../i18n/i18n.service';
import { I18N } from '../i18n/messages.generated';
import { SeoService } from '../shell/seo.service';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** « À propos et confidentialité » /<langue>/about/ : texte de i18n.js (aboutHtml), pré-rendu. */
@Component({
  selector: 'odo-about-page',
  imports: [RouterLink],
  template: `<article>
    <a class="back" [routerLink]="['/', i18n.lang()]">{{ i18n.t('back') }}</a>
    <h1>{{ i18n.t('about') }}</h1>
    <!-- texte du site (i18n.js), pas de données externes -->
    <div class="body" [innerHTML]="html()"></div>
  </article>`,
  styles: `
    :host { display: block; height: 100%; overflow: auto; background: var(--mat-sys-surface); }
    article { max-width: 760px; margin: 0 auto; padding: 16px 20px 48px; font: var(--mat-sys-body-large); line-height: 1.6; }
    a { color: var(--mat-sys-primary); }
    .back { display: inline-block; margin: 4px 0 8px; font: var(--mat-sys-label-large); text-decoration: none; }
    h1 { font: 600 clamp(30px, 5vw, 40px)/1.15 Fraunces, Georgia, serif; margin: 8px 0 18px; color: var(--mat-sys-primary); }
    .body ::ng-deep h2 { font: 600 22px/1.25 Fraunces, Georgia, serif; margin: 28px 0 8px; }
    .body ::ng-deep p { margin: 0 0 12px; }
    .body ::ng-deep li { margin: 6px 0; }
    .body ::ng-deep .muted { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    @media (max-width: 760px) { article { padding: 12px 16px 40px; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly i18n = inject(I18nService);
  private readonly seo = inject(SeoService);

  protected readonly html = computed(() => {
    const mail = `<a href="mailto:${esc(I18N.contact)}">${esc(I18N.contact)}</a>`;
    const [y, m, d] = I18N.privacyUpdated.split('-').map(Number);
    const updated = new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    return this.i18n.t('aboutHtml').split('{contact}').join(mail)
      .split('{controller}').join(esc(I18N.controller)).split('{updated}').join(esc(updated));
  });

  constructor() {
    effect(() => {
      const url = (l: string) => `${FICHES.siteUrl}/${l}/about/`;
      this.seo.set({ title: this.i18n.t('about'), description: this.i18n.t('metaDesc'), canonical: url(this.i18n.lang()),
        alternates: Object.fromEntries(LANGS.map((l) => [l, url(l)])) });
    });
    inject(DestroyRef).onDestroy(() => this.seo.clear());
  }
}
