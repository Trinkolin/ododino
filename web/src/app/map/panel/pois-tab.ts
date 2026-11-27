import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { I18nService } from '../../i18n/i18n.service';
import { Icon } from '../../shell/icon';
import { CATS, Cat, norm } from '../config';
import { DataService, Poi } from '../data.service';
import { FavoritesService } from '../favorites.service';
import { MapStateService } from '../map-state.service';
import { Chip, FilterChips } from './filter-chips';

/** Onglet « Lieux » : recherche, filtres par catégorie, liste (lieux à fiche d'abord, ★). */
@Component({
  selector: 'odo-pois-tab',
  imports: [ScrollingModule, MatFormFieldModule, MatInputModule, FilterChips, Icon],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
      <odo-icon matPrefix name="search" />
      <input matInput type="search" [placeholder]="i18n.t('searchPoi')" [value]="q()" (input)="q.set($any($event.target).value)" autocomplete="off" />
    </mat-form-field>
    <odo-filter-chips [chips]="chips()" [selected]="state.cats()" [label]="i18n.t('tabPois')"
      (toggle)="toggle($any($event))" (solo)="state.cats.set(single($any($event)))" (all)="all($event)" />
    <cdk-virtual-scroll-viewport itemSize="56" class="vlist">
      <div *cdkVirtualFor="let x of list(); trackBy: trackId" class="item" role="button" tabindex="0"
        [class.sel]="state.selectedId() === x.id" (click)="state.selectPoi(x)" (keydown.enter)="state.selectPoi(x)">
        <span class="ico" [style.background]="CATS[x.cat].color">{{ CATS[x.cat].icon }}</span>
        <span class="txt">
          <span class="t">{{ state.poiTitle(x.p) }}@if (x.star) { <span class="star">★</span> }@if (favs.has(x.id)) { <span class="heart">♥</span> }</span>
          <span class="m">{{ sub(x) }}</span>
        </span>
      </div>
    </cdk-virtual-scroll-viewport>
    @if (!list().length && data.loaded()) { <p class="empty">{{ i18n.t('noResult') }}</p> }
  `,
  styleUrl: './list-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoisTab {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly data = inject(DataService);
  protected readonly favs = inject(FavoritesService);
  protected readonly CATS = CATS;
  protected readonly q = signal('');
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  constructor() {
    // la liste a été mesurée onglet masqué (hauteur 0) : on la remesure quand l'onglet s'affiche
    effect(() => { if (this.state.tab() === 'pois' || this.state.sheet()) setTimeout(() => this.viewport()?.checkViewportSize()); });
  }

  protected readonly chips = computed<Chip[]>(() => {
    const counts = new Map<Cat, number>();
    for (const x of this.data.pois()) counts.set(x.cat, (counts.get(x.cat) ?? 0) + 1);
    return (Object.keys(CATS) as Cat[]).filter((k) => counts.has(k))
      .map((k) => ({ key: k, label: this.i18n.cat(k), color: CATS[k].color, count: counts.get(k)! }));
  });

  protected readonly list = computed(() => {
    const q = norm(this.q()), l = this.i18n.lang();
    return this.data.pois()
      .filter((x) => this.state.cats().has(x.cat) && (!q || norm([this.state.poiTitle(x.p), x.p['name'], x.p['name:sl'], x.p['name:it'],
        x.p['description'], this.i18n.cat(x.cat)].join(' ')).includes(q)))
      .map((x) => ({ x, title: this.state.poiTitle(x.p) }))
      .sort((a, b) => (+b.x.star - +a.x.star) || (a.x.p['name'] ? 0 : 1) - (b.x.p['name'] ? 0 : 1) || a.title.localeCompare(b.title, l))
      .map((e) => e.x);
  });

  protected sub(x: Poi): string {
    const title = this.state.poiTitle(x.p);
    const other = [x.p['name'], x.p['name:sl'], x.p['name:it']].find((n) => n && n !== title);
    return [this.i18n.cat(x.cat, true), x.p['ele'] && `${Math.round(+x.p['ele'])} m`, other].filter(Boolean).join(' · ');
  }
  protected trackId = (_: number, x: { id: string }) => x.id;

  protected toggle(k: Cat): void {
    const s = new Set(this.state.cats());
    if (s.has(k)) s.delete(k); else s.add(k);
    this.state.cats.set(s);
  }
  protected single(k: Cat): Set<Cat> { return new Set([k]); }
  protected all(on: boolean): void { this.state.cats.set(new Set(on ? this.chips().map((c) => c.key as Cat) : [])); }
}
