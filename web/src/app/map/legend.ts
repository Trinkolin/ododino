import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { I18nService } from '../i18n/i18n.service';
import { DIFF, Diff, NETS, Net } from './config';
import { MapStateService } from './map-state.service';

/** Légende des sentiers posée sur la carte, avec le choix de la couleur : difficulté (par défaut) ou réseau. */
@Component({
  selector: 'odo-legend',
  imports: [MatButtonToggleModule, MatExpansionModule, MatIconModule, MatListModule],
  template: `
    <mat-expansion-panel [expanded]="open()" (opened)="open.set(true)" (closed)="open.set(false)">
      <mat-expansion-panel-header><mat-panel-title>{{ i18n.t('legend') }}</mat-panel-title></mat-expansion-panel-header>
      <mat-button-toggle-group hideSingleSelectionIndicator [value]="state.colorBy()" (change)="state.colorBy.set($event.value)"
        [attr.aria-label]="i18n.t('legend')">
        <mat-button-toggle value="diff">{{ i18n.t('byDiff') }}</mat-button-toggle>
        <mat-button-toggle value="net">{{ i18n.t('byNet') }}</mat-button-toggle>
      </mat-button-toggle-group>
      <mat-list>
        @for (r of rows(); track r.label) {
          <mat-list-item><mat-icon matListItemIcon svgIcon="remove" [style.color]="r.color"></mat-icon><span matListItemTitle>{{ r.label }}</span></mat-list-item>
        }
      </mat-list>
    </mat-expansion-panel>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Legend implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly open = signal(true);
  protected readonly rows = computed(() => (this.state.colorBy() === 'diff'
    ? (Object.keys(DIFF) as Diff[]).map((k) => ({ color: DIFF[k], label: this.i18n.t('diff_' + k) }))
    : (Object.keys(NETS) as Net[]).map((k) => ({ color: NETS[k].color, label: this.i18n.t('nets.' + k) }))));

  ngOnInit(): void { this.open.set(!this.state.isMobile()); } // repliée sur téléphone
}
