import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FICHES } from '../cards/fiche';
import { I18nService, LANGS } from '../i18n/i18n.service';
import { I18N } from '../i18n/messages.generated';
import { SeoService } from '../shell/seo.service';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** « À propos et confidentialité » /<langue>/about/ : texte de i18n.js (aboutHtml), pré-rendu. */
@Component({
  selector: 'odo-about-page',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `<article class="width odo-stack">
    <div><a mat-button [routerLink]="['/', i18n.lang()]"><mat-icon svgIcon="arrow_back"></mat-icon> {{ back() }}</a></div>
    <h1 class="mat-headline-large">{{ i18n.t('about') }}</h1>
    <!-- texte du site (i18n.js), pas de données externes ; titres et paragraphes mis en forme par mat-typography -->
    <div [innerHTML]="html()"></div>
  </article>`,
  styles: `:host { display: block; } .width { max-width: 760px; margin: 0 auto; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly i18n = inject(I18nService);
  private readonly seo = inject(SeoService);
  protected readonly back = computed(() => this.i18n.t('back').replace(/^←\s*/, ''));

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
