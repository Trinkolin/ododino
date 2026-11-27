import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { I18nService } from '../i18n/i18n.service';
import { DIFF, Diff, NETS, Net } from './config';
import { MapStateService } from './map-state.service';

/** Légende des sentiers posée sur la carte, avec le choix de la couleur : difficulté (par défaut) ou réseau. */
@Component({
  selector: 'odo-legend',
  imports: [MatButtonToggleModule],
  template: `
    <details [open]="open()" (toggle)="open.set($any($event.target).open)">
      <summary>{{ i18n.t('legend') }}</summary>
      <mat-button-toggle-group hideSingleSelectionIndicator [value]="state.colorBy()" (change)="state.colorBy.set($event.value)"
        [attr.aria-label]="i18n.t('legend')">
        <mat-button-toggle value="diff">{{ i18n.t('byDiff') }}</mat-button-toggle>
        <mat-button-toggle value="net">{{ i18n.t('byNet') }}</mat-button-toggle>
      </mat-button-toggle-group>
      <ul>
        @for (r of rows(); track r.label) { <li><span class="sw" [style.background]="r.color"></span>{{ r.label }}</li> }
      </ul>
    </details>
  `,
  styles: `
    :host { display: block; background: var(--mat-sys-surface-container-lowest); color: var(--mat-sys-on-surface);
      border-radius: 14px; padding: 6px 10px; box-shadow: var(--mat-sys-level2); font: var(--mat-sys-body-small); min-width: 170px; }
    summary { cursor: pointer; font: var(--mat-sys-label-large); }
    mat-button-toggle-group { margin: 6px 0; --mat-button-toggle-height: 28px; font: var(--mat-sys-label-small); }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: 7px; margin: 3px 0; }
    .sw { width: 18px; height: 4px; border-radius: 2px; flex: none; }
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
