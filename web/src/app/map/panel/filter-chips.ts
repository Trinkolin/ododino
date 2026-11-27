import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';

export interface Chip { key: string; label: string; color: string; count: number; }

/**
 * Filtres sur une ligne qui défile (doigt, molette, barre fine sur ordinateur), précédés de
 * « Tout masquer / Tout afficher ». Double-clic sur un filtre : lui seul.
 * Actif : fond teinté, pastille de couleur. Inactif : contour seul, pastille vide.
 */
@Component({
  selector: 'odo-filter-chips',
  template: `
    <div class="row" role="group" [attr.aria-label]="label()" (wheel)="wheel($event)">
      <button type="button" class="chip all" (click)="all.emit(!anyOn())">{{ i18n.t(anyOn() ? 'hideAll' : 'showAll') }}</button>
      @for (c of chips(); track c.key) {
        <button type="button" class="chip" [class.off]="!selected().has(c.key)" [attr.aria-pressed]="selected().has(c.key)"
          (click)="$event.detail === 2 ? solo.emit(c.key) : toggle.emit(c.key)">
          <span class="dot" [style.background]="selected().has(c.key) ? c.color : null"></span>{{ c.label }} <small>{{ c.count }}</small>
        </button>
      }
    </div>
  `,
  styleUrl: './filter-chips.scss',
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

  /** La molette (verticale) fait défiler la ligne de côté : sinon une souris n'atteint pas les filtres cachés. */
  protected wheel(e: WheelEvent): void {
    const row = e.currentTarget as HTMLElement;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft += e.deltaY;
    e.preventDefault();
  }
}
