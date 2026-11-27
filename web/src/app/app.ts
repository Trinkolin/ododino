import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService, Lang } from './i18n/i18n.service';
import { Icon } from './shell/icon';
import { InstallService } from './shell/install.service';

/** Cadre de l'app : barre du haut (logo, installer l'app, langue) et page courante. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatMenuModule, MatTooltipModule, Icon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly install = inject(InstallService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  /** Même page dans une autre langue : /fr/matajur → /it/matajur */
  protected switchTo(l: Lang): void {
    const parts = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean);
    parts[0] = l;
    this.router.navigate(['/', ...parts], { preserveFragment: true });
  }

  protected installApp(): void {
    if (this.install.canPrompt()) this.install.prompt();
    else if (this.install.isIos()) this.snack.open(this.i18n.t('installIos'), this.i18n.t('ok'), { duration: 10000 });
  }
}
