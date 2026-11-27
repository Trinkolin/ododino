import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';

/** Page d'accueil « / » : dans le navigateur, on passe tout de suite à la langue du visiteur ; la version
 *  pré-rendue (moteurs de recherche, JavaScript lent) propose les 5 langues. */
@Component({
  selector: 'odo-home-redirect',
  imports: [RouterLink],
  template: `<nav class="langs-home" aria-label="Lingua · Jezik · Language · Sprache · Langue">
    @for (l of i18n.langs; track l.code) { <a [routerLink]="['/', l.code]" [attr.hreflang]="l.code">{{ l.label }}</a> }
  </nav>`,
  styles: `.langs-home { display: flex; gap: 12px; justify-content: center; padding: 48px 16px; font: var(--mat-sys-title-medium); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeRedirect implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (this.browser) // garde le #poi= / #trail= / #route= des liens partagés de la version actuelle
      this.router.navigate(['/', this.i18n.detect()], { replaceUrl: true, fragment: location.hash.slice(1) || undefined });
  }
}
