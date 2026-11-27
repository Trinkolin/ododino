import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';

/** Fiche phare /<langue>/<fiche>/ : phase 4 de la migration (contenu tiré de content/, pré-rendu). */
@Component({
  selector: 'odo-card-page',
  imports: [RouterLink],
  template: `<article class="card"><a [routerLink]="['/', i18n.lang()]">← {{ i18n.t('map') }}</a>
    <h1>{{ slug() }}</h1><p>Phase 4</p></article>`,
  styles: `.card { max-width: 720px; margin: 0 auto; padding: 16px; } h1 { font: var(--mat-sys-headline-medium); font-family: Fraunces, Georgia, serif; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPage {
  protected readonly i18n = inject(I18nService);
  readonly slug = input<string>('');
}
