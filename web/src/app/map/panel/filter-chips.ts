import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../i18n/i18n.service';

export interface Chip { key: string; label: string; color: string; count: number; }

/**
 * Filtres (puces Material à choix multiples) dans un panneau repliable, précédés de « Tout masquer / Tout afficher ».
 * Double-clic sur un filtre : lui seul. La pastille porte la couleur de la catégorie ou du réseau.
 */
@Component({
  selector: 'odo-filter-chips',
  imports: [MatChipsModule, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>{{ i18n.t('filters') }}</mat-panel-title>
        <mat-panel-description>{{ value().length }} / {{ chips().length }}</mat-panel-description>
      </mat-expansion-panel-header>
      <button mat-button (click)="all.emit(!anyOn())">{{ i18n.t(anyOn() ? 'hideAll' : 'showAll') }}</button>
      <mat-chip-listbox multiple [attr.aria-label]="label()" [value]="value()" (change)="change($event)">
        @for (c of chips(); track c.key) {
          <mat-chip-option [value]="c.key" (dblclick)="solo.emit(c.key)">
            <mat-icon matChipAvatar svgIcon="circle" [style.color]="c.color"></mat-icon>
            {{ c.label }} · {{ c.count }}
          </mat-chip-option>
        }
      </mat-chip-listbox>
    </mat-expansion-panel>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChips {
  protected readonly i18n = inject(I18nService);
  readonly chips = input.required<Chip[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly label = input('');
  readonly toggle = output<string>();
  readonly solo = output<string>();
  /** true : tout afficher ; false : tout masquer */
  readonly all = output<boolean>();
  protected readonly anyOn = computed(() => this.chips().some((c) => this.selected().has(c.key)));
  protected readonly value = computed(() => this.chips().map((c) => c.key).filter((k) => this.selected().has(k)));

  /** La puce cliquée est celle qui diffère entre l'ancienne et la nouvelle sélection. */
  protected change(e: MatChipListboxChange): void {
    const now = new Set<string>(e.value ?? []);
    const key = this.chips().map((c) => c.key).find((k) => now.has(k) !== this.selected().has(k));
    if (key) this.toggle.emit(key);
  }
}
