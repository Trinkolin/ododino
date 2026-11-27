import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '../../i18n/i18n.service';
import { ElevationProfile } from '../../geo/elevation-profile';
import { Icon } from '../../shell/icon';
import { hm } from '../config';
import { MapStateService } from '../map-state.service';
import { RouteService } from '../route.service';

const COLOR = '#0b7285';

/** Onglet « Itinéraire » : clic sur la carte = étape ; options de sécurité ; chiffres, profil, GPX. */
@Component({
  selector: 'odo-route-tab',
  imports: [MatButtonModule, MatSlideToggleModule, ElevationProfile, Icon],
  template: `
    <p class="help">{{ i18n.t('routeHelp') }}</p>
    @if (route.loading()) { <p class="muted">{{ i18n.t('routeLoading') }}</p> }
    @if (route.loadError()) { <p class="warn">{{ i18n.t('routeLoadError') }}</p> }
    <mat-slide-toggle [checked]="route.options().marked" (change)="route.setOption('marked', $event.checked)">{{ i18n.t('routeMarkedOnly') }}</mat-slide-toggle>
    <mat-slide-toggle [checked]="route.options().alpine" (change)="route.setOption('alpine', $event.checked)">{{ i18n.t('routeAllowAlpine') }}</mat-slide-toggle>

    <div class="btns">
      <button mat-stroked-button (click)="route.undo()" [disabled]="!route.points().length || !!route.imported()">↶ {{ i18n.t('routeUndo') }}</button>
      <button mat-stroked-button (click)="route.clear()">✕ {{ i18n.t('routeClear') }}</button>
      <button mat-stroked-button (click)="file.click()">⬆ {{ i18n.t('routeImport') }}</button>
      <button mat-flat-button (click)="route.exportGpx()" [disabled]="route.coords().length < 2"><odo-icon name="download" /> {{ i18n.t('routeExport') }}</button>
      <input #file type="file" accept=".gpx,application/gpx+xml" hidden (change)="importFile($any($event.target))" />
    </div>
    @if (route.imported(); as imp) { <p class="muted">{{ i18n.t('routeImported') }} : {{ imp.name }}</p> }

    @if (warnings().length) {
      <div class="warnbox" role="alert">@for (w of warnings(); track w) { <p>⚠ {{ w }}</p> }</div>
    }

    @if (route.profile(); as p) {
      <div class="row">
        <span>{{ i18n.t('length') }} <b>{{ i18n.num(p.total / 1000, 1) }} km</b></span>
        @if (p.hasEle) { <span>{{ i18n.t('timeEst') }} <b>{{ hm(p.minutes) }}</b></span> }
      </div>
      @if (p.hasEle) {
        <div class="row">
          <span>{{ i18n.t('ascent') }} <b>{{ i18n.num(p.gain) }} m</b></span>
          <span>{{ i18n.t('descent') }} <b>{{ i18n.num(p.loss) }} m</b></span>
          <span>{{ i18n.t('altRange') }} <b>{{ i18n.num(p.min) }} – {{ i18n.num(p.max) }} m</b></span>
        </div>
        <odo-elevation-profile [pr]="p.pr" [color]="color" (hover)="state.map?.showPoint($event, color)" />
      } @else {
        <p class="muted">{{ i18n.t('importNoEle') }}</p>
      }
    }
    <p class="muted small">{{ i18n.t('routeShare') }}</p>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
    .help { margin: 0; font: var(--mat-sys-body-medium); }
    .muted { margin: 0; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    .small { font-size: 11.5px; }
    .warn { margin: 0; color: #c92a2a; }
    mat-slide-toggle { font: var(--mat-sys-body-small); }
    .btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .btns odo-icon { width: 18px; height: 18px; margin-right: 2px; }
    .warnbox { border-radius: 10px; background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); padding: 8px 10px; font: var(--mat-sys-body-small); }
    .warnbox p { margin: 0; }
    .warnbox p + p { margin-top: 4px; }
    .row { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    .row b { color: var(--mat-sys-on-surface); }
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
