import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { filter, skip } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService, Lang } from './i18n/i18n.service';
import { MatIconModule } from '@angular/material/icon';
import { InstallService } from './shell/install.service';
import { MapStateService } from './map/map-state.service';

/** Cadre de l'app : barre du haut (logo, installer l'app, langue) et page courante. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatMenuModule, MatTooltipModule, MatIconModule],
  templateUrl: './app.html',
  styles: `
    :host { display: flex; flex-direction: column; height: 100dvh; }
    .page { flex: 1; min-height: 0; overflow: auto; }
    .spacer { flex: 1; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly install = inject(InstallService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  protected readonly map = inject(MapStateService);

  constructor() {
    // Statistiques (GoatCounter, sans cookies) : la première page est comptée par count.js, les suivantes ici
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd), skip(1)).subscribe(() => {
        (window as unknown as { goatcounter?: { count?: (o: { path: string }) => void } }).goatcounter?.count?.({ path: location.pathname });
      });
    }
  }

  /** Même page dans une autre langue : /fr/matajur → /it/matajur */
  protected switchTo(l: Lang): void {
    const parts = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean);
    parts[0] = l;
    this.router.navigate(['/', ...parts], { preserveFragment: true });
  }

  /** Bouton menu (téléphone) : ouvre ou ferme le panneau ; depuis une fiche, revient d'abord à la carte. */
  protected togglePanel(): void {
    const onMap = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean).length <= 1;
    if (!onMap) { this.router.navigate(['/', this.i18n.lang()]); this.map.panelOpen.set(true); return; }
    this.map.panelOpen.update((v) => !v);
  }

  protected installApp(): void {
    if (this.install.canPrompt()) this.install.prompt();
    else if (this.install.isIos()) this.snack.open(this.i18n.t('installIos'), this.i18n.t('ok'), { duration: 10000 });
  }
}
