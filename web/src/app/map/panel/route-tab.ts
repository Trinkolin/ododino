import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { I18nService } from '../../i18n/i18n.service';
import { ElevationProfile } from '../../geo/elevation-profile';
import { MatIconModule } from '@angular/material/icon';
import { hm } from '../config';
import { MapStateService } from '../map-state.service';
import { RouteService } from '../route.service';

const COLOR = '#0b7285';

/** Onglet « Itinéraire » : clic sur la carte = étape ; options de sécurité ; chiffres, profil, GPX. */
@Component({
  selector: 'odo-route-tab',
  imports: [MatButtonModule, MatSlideToggleModule, MatCardModule, MatListModule, MatProgressBarModule, ElevationProfile, MatIconModule],
  template: `
    <div class="odo-stack">
      <p class="mat-body-medium">{{ i18n.t('routeHelp') }}</p>
      @if (route.loading()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
      @if (route.loadError()) { <p class="mat-body-medium">{{ i18n.t('routeLoadError') }}</p> }
      <mat-slide-toggle [checked]="route.options().marked" (change)="route.setOption('marked', $event.checked)">{{ i18n.t('routeMarkedOnly') }}</mat-slide-toggle>
      <mat-slide-toggle [checked]="route.options().alpine" (change)="route.setOption('alpine', $event.checked)">{{ i18n.t('routeAllowAlpine') }}</mat-slide-toggle>

      <div class="odo-row">
        <button mat-stroked-button (click)="route.undo()" [disabled]="!route.points().length || !!route.imported()"><mat-icon svgIcon="undo"></mat-icon> {{ i18n.t('routeUndo') }}</button>
        <button mat-stroked-button (click)="route.clear()"><mat-icon svgIcon="delete"></mat-icon> {{ i18n.t('routeClear') }}</button>
        <button mat-stroked-button (click)="file.click()"><mat-icon svgIcon="upload"></mat-icon> {{ i18n.t('routeImport') }}</button>
        <button mat-flat-button (click)="route.exportGpx()" [disabled]="route.coords().length < 2"><mat-icon svgIcon="download"></mat-icon> {{ i18n.t('routeExport') }}</button>
        <input #file type="file" accept=".gpx,application/gpx+xml" hidden (change)="importFile($any($event.target))" />
      </div>
      @if (route.imported(); as imp) { <p class="mat-body-small">{{ i18n.t('routeImported') }} : {{ imp.name }}</p> }

      @if (warnings().length) {
        <mat-card appearance="outlined" role="alert">
          <mat-list>
            @for (w of warnings(); track w) {
              <mat-list-item lines="3"><mat-icon matListItemIcon svgIcon="warning"></mat-icon><span matListItemTitle>{{ w }}</span></mat-list-item>
            }
          </mat-list>
        </mat-card>
      }

      @if (route.profile(); as p) {
        <mat-list>
          <mat-list-item><span matListItemTitle>{{ i18n.num(p.total / 1000, 1) }} km</span><span matListItemLine>{{ i18n.t('length') }}</span></mat-list-item>
          @if (p.hasEle) {
            <mat-list-item><span matListItemTitle>{{ hm(p.minutes) }}</span><span matListItemLine>{{ i18n.t('timeEst') }}</span></mat-list-item>
            <mat-list-item><span matListItemTitle>+{{ i18n.num(p.gain) }} m / −{{ i18n.num(p.loss) }} m</span><span matListItemLine>{{ i18n.t('ascent') }} / {{ i18n.t('descent') }}</span></mat-list-item>
            <mat-list-item><span matListItemTitle>{{ i18n.num(p.min) }} – {{ i18n.num(p.max) }} m</span><span matListItemLine>{{ i18n.t('altRange') }}</span></mat-list-item>
          }
        </mat-list>
        @if (p.hasEle) {
          <odo-elevation-profile [pr]="p.pr" [color]="color" (hover)="state.map?.showPoint($event, color)" />
        } @else {
          <p class="mat-body-small">{{ i18n.t('importNoEle') }}</p>
        }
      }
      <p class="mat-body-small">{{ i18n.t('routeShare') }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteTab {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly route = inject(RouteService);
  protected readonly hm = hm;
  protected readonly color = COLOR;

  /** Étape impossible ; passages difficiles (SAC T3 et plus) sur le tracé calculé */
  protected readonly warnings = computed(() => {
    const out: string[] = [];
    if (this.route.failed()) out.push(this.i18n.t('routeFail'));
    if (this.route.maxSac() >= 4) out.push(this.i18n.t('routeWarnT4'));
    else if (this.route.maxSac() >= 3) out.push(this.i18n.t('routeWarnT3'));
    return out;
  });

  constructor() {
    // le graphe des chemins se charge dès que l'onglet s'ouvre
    effect(() => { if (this.state.tab() === 'route') this.route.load().catch(() => undefined); });
  }

  protected async importFile(input: HTMLInputElement): Promise<void> {
    const f = input.files?.[0]; input.value = '';
    if (!f) return;
    const pts = await this.route.importGpx(f);
    if (pts) this.state.map?.fitCoords(pts.map((p) => [p[0], p[1]]));
  }
}
