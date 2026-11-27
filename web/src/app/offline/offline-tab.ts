import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from '../i18n/i18n.service';
import { MapStateService } from '../map/map-state.service';
import { Icon } from '../shell/icon';
import { OfflineService } from './offline.service';

/** Onglet « Hors ligne » : télécharger, mettre à jour ou supprimer le pack. */
@Component({
  selector: 'odo-offline-tab',
  imports: [MatButtonModule, MatProgressBarModule, Icon],
  template: `
    @if (!off.supported) {
      <p class="muted">{{ i18n.t('offlineUnsupported') }}</p>
    } @else if (off.busy()) {
      <p>{{ i18n.t('offlineProgress').replace('{p}', percent() + '') }}</p>
      <mat-progress-bar mode="determinate" [value]="percent()" />
    } @else if (off.saved(); as s) {
      <p class="ok"><odo-icon name="download_done" /> {{ i18n.t('offlineReady').replace('{date}', date(s.at)) }}</p>
      @if (stale()) { <p class="muted">{{ i18n.t('offlineStale') }}</p> }
      <div class="btns">
        @if (off.manifest() && stale()) {
          <button mat-flat-button (click)="download()">{{ i18n.t('offlineUpdate') }}</button>
        } @else if (off.manifest()) {
          <button mat-stroked-button (click)="download()">{{ i18n.t('offlineRefresh') }}</button>
        }
        <button mat-stroked-button (click)="off.remove()">{{ i18n.t('offlineRemove') }}</button>
      </div>
    } @else if (off.manifest(); as m) {
      <p class="muted">{{ i18n.t('offlineNote') }}</p>
      <div class="btns">
        <button mat-flat-button (click)="download()"><odo-icon name="download" /> {{ i18n.t('offlineDownload').replace('{size}', mb(m.bytes)) }}</button>
      </div>
    } @else if (off.manifest() === null) {
      <p class="muted">{{ i18n.t('offlineUnavailable') }}</p>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 10px; padding: 14px 12px; font: var(--mat-sys-body-medium); }
    p { margin: 0; }
    .muted { color: var(--mat-sys-on-surface-variant); }
    .ok { display: flex; align-items: center; gap: 6px; color: var(--mat-sys-primary); font-weight: 600; }
    .btns { display: flex; flex-wrap: wrap; gap: 8px; }
    odo-icon { width: 20px; height: 20px; }
    .btns odo-icon { width: 18px; height: 18px; margin-right: 4px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineTab {
  protected readonly i18n = inject(I18nService);
  protected readonly off = inject(OfflineService);
  private readonly state = inject(MapStateService);
  private readonly snack = inject(MatSnackBar);

  protected readonly percent = computed(() => {
    const m = this.off.manifest(); return m ? Math.round((this.off.done() / m.bytes) * 100) : 0;
  });
  /** les données du site ont changé depuis le téléchargement */
  protected readonly stale = computed(() => {
    const s = this.off.saved(), m = this.off.manifest(); return !!s && !!m && s.version !== m.version;
  });

  constructor() {
    // la liste du pack se lit à l'ouverture de l'onglet
    effect(() => { if (this.state.tab() === 'offline' && this.off.supported) this.off.loadManifest(); });
  }

  protected async download(): Promise<void> {
    const ok = await this.off.download();
    this.snack.open(this.i18n.t(ok ? 'offlineDone' : 'offlineError'), undefined, { duration: 4000 });
  }
  protected mb(b: number): string { return `${this.i18n.num(Math.round(b / 1e6))} ${this.i18n.lang() === 'fr' ? 'Mo' : 'MB'}`; }
  protected date(at: number): string { return new Date(at).toLocaleDateString(this.i18n.locale()); }
}
