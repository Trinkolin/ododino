import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { I18nService } from '../../i18n/i18n.service';
import { MatIconModule } from '@angular/material/icon';
import { PackImg } from '../../offline/pack-img';
import { CATS, NETS } from '../config';
import { CardInfo, DataService } from '../data.service';
import { FavoritesService } from '../favorites.service';
import { MapStateService } from '../map-state.service';

/** Onglet « Découvrir » : mes favoris, puis les fiches phares (vignette, titre, résumé, « Sur la carte »). */
@Component({
  selector: 'odo-discover-tab',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatListModule, MatIconModule, PackImg],
  templateUrl: './discover-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverTab {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  private readonly data = inject(DataService);
  private readonly favs = inject(FavoritesService);

  protected readonly favItems = computed(() => [...this.favs.ids()].map((id) => {
    const poi = this.data.pois().find((x) => x.id === id);
    if (poi) return { id, title: this.state.poiTitle(poi.p), sub: this.i18n.cat(poi.cat, true), color: CATS[poi.cat].color, icon: 'location_on' };
    const tr = this.data.trails().find((x) => x.id === id);
    if (tr) return { id, title: this.state.trailTitle(tr.p), sub: [tr.p['ref'], `${this.i18n.num(tr.p['stats']?.km ?? tr.km, 1)} km`].filter(Boolean).join(' · '),
      color: this.state.trailColor(tr), icon: 'hiking' };
    return null;
  }).filter((x) => x !== null));

  protected readonly cards = computed(() => {
    const rank = { intro: 0, place: 1, trail: 2 }, l = this.i18n.lang();
    return [...this.data.cards()].sort((a, b) => rank[a.kind] - rank[b.kind] || (a.titles[l] ?? '').localeCompare(b.titles[l] ?? '', l));
  });

  protected color(c: CardInfo): string {
    return c.kind === 'trail' ? NETS.lwn.color : c.cat ? CATS[c.cat].color : 'var(--mat-sys-primary)';
  }
  protected icon(c: CardInfo): string { return c.kind === 'trail' ? 'hiking' : c.kind === 'intro' ? 'explore' : 'location_on'; }
  /** La description d'une fiche (faite pour les moteurs de recherche) répète le titre avant « : ». */
  protected summary(c: CardInfo): string {
    const d = c.descriptions[this.i18n.lang()] ?? '';
    const rest = d.split(/\s?:\s/).slice(1).join(': ').trim();
    return rest ? rest[0].toLocaleUpperCase(this.i18n.lang()) + rest.slice(1) : d;
  }
}
