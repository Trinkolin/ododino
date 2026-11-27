import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '../../i18n/i18n.service';
import { Icon } from '../../shell/icon';
import { NETS, Net, norm } from '../config';
import { DataService, Trail } from '../data.service';
import { FavoritesService } from '../favorites.service';
import { MapStateService } from '../map-state.service';
import { Chip, FilterChips } from './filter-chips';

/** Onglet « Sentiers » : recherche, filtres par réseau, chemins et pistes, liste. (Détail et profil : phase 3.) */
@Component({
  selector: 'odo-trails-tab',
  imports: [ScrollingModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, FilterChips, Icon],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
      <odo-icon matPrefix name="search" />
      <input matInput type="search" [placeholder]="i18n.t('searchTrail')" [value]="q()" (input)="q.set($any($event.target).value)" autocomplete="off" />
    </mat-form-field>
    <odo-filter-chips [chips]="chips()" [selected]="state.nets()" [label]="i18n.t('tabTrails')"
      (toggle)="toggle($any($event))" (solo)="state.nets.set(single($any($event)))" (all)="all($event)" />
    <mat-slide-toggle [checked]="state.showPaths()" (change)="state.showPaths.set($event.checked)" class="paths">{{ i18n.t('showPaths') }}</mat-slide-toggle>
    <cdk-virtual-scroll-viewport itemSize="56" class="vlist">
      <div *cdkVirtualFor="let x of list(); trackBy: trackId" class="item" role="button" tabindex="0"
        [class.sel]="state.selectedId() === x.id" (click)="state.selectTrail(x)" (keydown.enter)="state.selectTrail(x)">
        <span class="ref" [style.background]="state.trailColor(x)">{{ x.p['ref'] || '—' }}</span>
        <span class="txt">
          <span class="t">{{ state.trailTitle(x.p) }}@if (favs.has(x.id)) { <span class="heart">♥</span> }</span>
          <span class="m">{{ sub(x) }}</span>
        </span>
      </div>
    </cdk-virtual-scroll-viewport>
    @if (!list().length && data.loaded()) { <p class="empty">{{ i18n.t('noTrail') }}</p> }
  `,
  styleUrl: './list-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailsTab {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly data = inject(DataService);
  protected readonly favs = inject(FavoritesService);
  protected readonly q = signal('');
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  constructor() {
    // la liste a été mesurée onglet masqué (hauteur 0) : on la remesure quand l'onglet s'affiche
    effect(() => { if (this.state.tab() === 'trails' || this.state.sheet()) setTimeout(() => this.viewport()?.checkViewportSize()); });
  }

  protected readonly chips = computed<Chip[]>(() => {
    const counts = new Map<Net, number>();
    for (const x of this.data.trails()) counts.set(x.net, (counts.get(x.net) ?? 0) + 1);
    return (Object.keys(NETS) as Net[]).filter((k) => counts.has(k))
      .map((k) => ({ key: k, label: this.i18n.t('nets.' + k), color: NETS[k].color, count: counts.get(k)! }));
  });

  protected readonly list = computed(() => {
    const q = norm(this.q());
    return this.data.trails().filter((x) => this.state.nets().has(x.net)
      && (!q || norm([this.state.trailTitle(x.p), x.p['name'], x.p['ref'], x.p['from'], x.p['to'], x.p['description']].join(' ')).includes(q)));
  });

  protected sub(x: Trail): string {
    return [`${this.i18n.num(x.km, 1)} km`, x.p['cai_scale'], this.i18n.t('nets.' + x.net)].filter(Boolean).join(' · ');
  }
  protected trackId = (_: number, x: { id: string }) => x.id;
  protected toggle(k: Net): void {
    const s = new Set(this.state.nets());
    if (s.has(k)) s.delete(k); else s.add(k);
    this.state.nets.set(s);
  }
  protected single(k: Net): Set<Net> { return new Set([k]); }
  protected all(on: boolean): void { this.state.nets.set(new Set(on ? this.chips().map((c) => c.key as Net) : [])); }
}
