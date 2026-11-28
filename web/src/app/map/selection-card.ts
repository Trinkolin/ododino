import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '../i18n/i18n.service';
import { I18N } from '../i18n/messages.generated';
import { MatIconModule } from '@angular/material/icon';
import { CATS, dist, hm, noteUrl, safeUrl } from './config';
import { DataService, Poi, Trail } from './data.service';
import { FavoritesService } from './favorites.service';
import { MapStateService, Selection } from './map-state.service';
import { RouteService } from './route.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Carte de sélection posée sur la carte (remplace la bulle Leaflet) : le lieu ou le sentier choisi,
 * ses informations utiles, « Lire la fiche », « Favori », et les liens externes.
 */
@Component({
  selector: 'odo-selection-card',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatListModule, MatTooltipModule],
  templateUrl: './selection-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionCard {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly favs = inject(FavoritesService);
  private readonly data = inject(DataService);
  private readonly route = inject(RouteService);
  private readonly snack = inject(MatSnackBar);
  protected readonly CATS = CATS;
  protected readonly timetableUrl = I18N.timetableUrl;

  protected readonly sel = this.state.selection;
  protected readonly featured = computed(() => {
    const s = this.sel(); return s ? this.data.featured()[s.item.id] ?? null : null;
  });

  /** En-tête de la carte : couleur, titre, sous-titre (catégorie et autres noms, ou chiffres du sentier) */
  protected head(s: NonNullable<Selection>): { color: string; title: string; sub: string } {
    if (s.kind === 'poi') {
      const alt = this.poiAlt(s.item);
      return { color: CATS[s.item.cat].color, title: this.state.poiTitle(s.item.p), sub: this.i18n.cat(s.item.cat, true) + (alt ? ` · ${alt}` : '') };
    }
    return { color: this.state.trailColor(s.item), title: this.state.trailTitle(s.item.p), sub: this.trailMetrics(s.item) };
  }

  // ---------- Lieu ----------
  protected poiAlt(x: Poi): string {
    const title = this.state.poiTitle(x.p);
    return [...new Set([x.p['name'], x.p['name:sl'], x.p['name:it']].filter((n) => n && n !== title))].join(' / ');
  }
  /** Lignes d'information d'un lieu, seulement celles qui ont une valeur. */
  protected poiRows(x: Poi): { k: string; v: string; cls?: string }[] {
    const p = x.p, t = (k: string) => this.i18n.t(k);
    const rows: { k: string; v: string; cls?: string }[] = [
      { k: 'altitude', v: p['ele'] ? `${this.i18n.num(Math.round(+p['ele']))} m` : '' },
      { k: 'type', v: p['historic']?.replace(/_/g, ' ') ?? '' },
      { k: 'hours', v: p['opening_hours'] ?? '' },
      { k: 'cuisine', v: p['cuisine']?.replace(/;/g, ', ') ?? '' },
      { k: 'drinking', v: p['potable'] === 'yes' ? t('drinkingYes') : p['potable'] === 'no' ? t('drinkingNo') : '', cls: p['potable'] === 'no' ? 'warn' : '' },
      { k: 'checked', v: this.fmtDate(p['check_date:drinking_water'] || p['check_date']) },
      { k: 'inscription', v: p['inscription'] ?? '' },
      { k: 'fee', v: p['fee'] === 'yes' ? t('yes') : p['fee'] === 'no' ? t('no') : '' },
      { k: 'capacity', v: p['capacity'] ?? '' },
      { k: 'lines', v: p['route_ref']?.replace(/;/g, ', ') ?? '' },
    ];
    return rows.filter((r) => r.v);
  }
  protected phone(x: Poi): string { return x.p['phone'] || x.p['contact:phone'] || ''; }
  protected web(x: Poi): string { return safeUrl(x.p['website'] || x.p['contact:website'] || x.p['url']); }
  /** « it:Titre » : la langue finit dans le nom de domaine, elle doit être un vrai code de langue. */
  protected wiki(x: Poi): string {
    const w = x.p['wikipedia'];
    if (!w || !/^[a-z]{2,3}(-[a-z]+)?:./.test(w)) return '';
    const [lang, ...rest] = w.split(':');
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(rest.join(':'))}`;
  }
  protected readonly note = noteUrl;
  protected isWater(x: Poi): boolean { return x.cat === 'water' || x.cat === 'drinking'; }
  /** Sentiers qui passent à moins de 250 m du lieu. */
  protected near(x: Poi): Trail[] {
    return this.data.trails().filter((tr) => tr.coords.some((part) => part.some((c) =>
      Math.abs(c[1] - x.lat) < 0.005 && dist(c, [x.lon, x.lat]) < 250))).slice(0, 6);
  }
  private fmtDate(v?: string): string {
    if (!v || !/^\d{4}-\d{2}(-\d{2})?$/.test(v)) return v ?? '';
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d || 1).toLocaleDateString(this.i18n.locale(),
      d ? { day: 'numeric', month: 'long', year: 'numeric' } : { month: 'long', year: 'numeric' });
  }

  // ---------- Sentier ----------
  protected trailMetrics(x: Trail): string {
    const st = x.p['stats'];
    return [`${this.i18n.num(st ? st.km : x.km, 1)} km`, st && `+${st.gain} m / −${st.loss} m`, st && hm(st.minutes),
      this.state.diffText(x.p)].filter(Boolean).join(' · ');
  }
  protected details(): void { this.state.tab.set('trails'); this.state.showPanel(true); }

  /** « + Itinéraire » : le lieu devient une étape du traceur (recalée sur le chemin le plus proche). */
  protected async addToRoute(x: Poi): Promise<void> {
    this.state.clear();
    this.state.tab.set('route');
    this.state.showPanel(true);
    if (await this.route.add(x.lat, x.lon)) {
      this.snack.open(this.i18n.t('routeAdded').replace('{name}', this.state.poiTitle(x.p)), undefined, { duration: 3500 });
    }
  }
}
