import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '../i18n/i18n.service';
import { ElevationProfile } from '../geo/elevation-profile';
import { ProfilePoints } from '../geo/geo';
import { MatIconModule } from '@angular/material/icon';
import { hm, noteUrl, safeUrl } from './config';
import { DataService, Trail } from './data.service';
import { FavoritesService } from './favorites.service';
import { MapStateService } from './map-state.service';
import { packFetch } from '../offline/pack';

const profiles = new Map<string, Promise<ProfilePoints | null>>();
/** Profil d'altitude d'un sentier (data/profiles/<id>.json, calculé par tools/enrich_trails.py), chargé une fois. */
function loadProfile(rid: string): Promise<ProfilePoints | null> {
  if (!profiles.has(rid)) {
    const p = packFetch(`data/profiles/${rid}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    profiles.set(rid, p);
    p.then((v) => { if (!v) profiles.delete(rid); }); // sans réseau ni pack : nouvel essai plus tard
  }
  return profiles.get(rid)!;
}

/** Détail d'un sentier dans l'onglet « Sentiers » : chiffres, profil d'altitude, description, GPX, liens. */
@Component({
  selector: 'odo-trail-detail',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatListModule, MatTooltipModule, ElevationProfile, MatIconModule],
  template: `
    @let t = trail();
    @let st = t.p['stats'];
    <mat-card appearance="outlined" class="detail">
      <mat-card-header>
        <mat-icon mat-card-avatar svgIcon="hiking" [style.color]="state.trailColor(t)"></mat-icon>
        <mat-card-title>{{ state.trailTitle(t.p) }}</mat-card-title>
        <mat-card-subtitle>@if (t.p['ref']) { {{ t.p['ref'] }} · }{{ i18n.t('nets.' + t.net) }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <mat-list>
          <mat-list-item><span matListItemTitle>{{ i18n.num(st ? st.km : t.km, 1) }} km</span><span matListItemLine>{{ i18n.t('length') }}</span></mat-list-item>
          @if (t.p['duration']) {
            <mat-list-item><span matListItemTitle>{{ caiDuration() }}</span><span matListItemLine>{{ i18n.t('durationCai') }}</span></mat-list-item>
          } @else if (st) {
            <mat-list-item><span matListItemTitle>{{ hm(st.minutes) }}</span><span matListItemLine>{{ i18n.t('timeEst') }}</span></mat-list-item>
          }
          <mat-list-item><span matListItemTitle>{{ state.diffText(t.p) }}</span><span matListItemLine>{{ i18n.t('difficulty') }}</span></mat-list-item>
          @if (st) {
            <mat-list-item><span matListItemTitle>+{{ i18n.num(st.gain) }} m / −{{ i18n.num(st.loss) }} m</span><span matListItemLine>{{ i18n.t('ascent') }} / {{ i18n.t('descent') }}</span></mat-list-item>
            <mat-list-item><span matListItemTitle>{{ i18n.num(st.min) }} – {{ i18n.num(st.max) }} m</span><span matListItemLine>{{ i18n.t('altRange') }}</span></mat-list-item>
          }
          @if (t.p['from']) { <mat-list-item><span matListItemTitle>{{ t.p['from'] }}</span><span matListItemLine>{{ i18n.t('from') }}</span></mat-list-item> }
          @if (t.p['to']) { <mat-list-item><span matListItemTitle>{{ t.p['to'] }}</span><span matListItemLine>{{ i18n.t('to') }}</span></mat-list-item> }
        </mat-list>
        @if (profile(); as pr) {
          <odo-elevation-profile [pr]="pr" [color]="state.trailColor(t)" (hover)="state.map?.showPoint($event, state.trailColor(t))" />
        } @else if (!t.p['ordered']) {
          <p class="mat-body-small">{{ i18n.t('profileNA') }}</p>
        }
        @if (t.p['description']) { <p>{{ t.p['description'] }}</p> }
      </mat-card-content>
      <mat-card-actions>
        @if (featured(); as f) {
          <a mat-flat-button [routerLink]="['/', i18n.lang(), f.slug]"><mat-icon svgIcon="menu_book"></mat-icon> {{ i18n.t('readMore') }}</a>
        }
        <a mat-button [href]="'data/gpx/' + rid() + '.gpx'" [attr.download]="'ododino-' + fileName() + '.gpx'" (click)="gpx($event)">
          <mat-icon svgIcon="download"></mat-icon> {{ i18n.t('gpx') }}</a>
        <button mat-icon-button (click)="favs.toggle(t.id)" [attr.aria-pressed]="favs.has(t.id)" [attr.aria-label]="i18n.t('fav')" [matTooltip]="i18n.t('fav')">
          <mat-icon [svgIcon]="favs.has(t.id) ? 'favorite' : 'favorite_border'"></mat-icon></button>
        <button mat-icon-button (click)="state.clear()" [attr.aria-label]="i18n.t('close')" [matTooltip]="i18n.t('close')"><mat-icon svgIcon="close"></mat-icon></button>
      </mat-card-actions>
      <mat-card-actions>
        <a mat-button [href]="'https://www.openstreetmap.org/' + t.id" target="_blank" rel="noopener"><mat-icon svgIcon="open_in_new"></mat-icon> {{ i18n.t('viewOsm') }}</a>
        @if (web()) { <a mat-button [href]="web()" target="_blank" rel="noopener noreferrer"><mat-icon svgIcon="language"></mat-icon> {{ i18n.t('website') }}</a> }
        <a mat-button [href]="report()" target="_blank" rel="noopener"><mat-icon svgIcon="flag"></mat-icon> {{ i18n.t('report') }}</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `.detail { margin: 16px 16px 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailDetail {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  protected readonly favs = inject(FavoritesService);
  private readonly data = inject(DataService);
  readonly trail = input.required<Trail>();
  protected readonly hm = hm;
  protected readonly profile = signal<ProfilePoints | null>(null);
  protected readonly rid = computed(() => this.trail().id.split('/')[1]);
  protected readonly fileName = computed(() => String(this.trail().p['ref'] || this.rid()).replace(/[^\w-]+/g, '_'));
  protected readonly featured = computed(() => this.data.featured()[this.trail().id] ?? null);
  protected readonly web = computed(() => safeUrl(this.trail().p['website']));
  /** Durée du CAI (« 3:30 ») en « 3 h 30 » */
  protected readonly caiDuration = computed(() => String(this.trail().p['duration']).replace(/^0?(\d+):(\d\d).*/, '$1 h $2'));

  constructor() {
    effect(() => {
      const t = this.trail();
      this.profile.set(null);
      if (t.p['ordered']) loadProfile(this.rid()).then((pr) => { if (this.trail() === t) this.profile.set(pr); });
    });
  }

  /** « Signaler une erreur » : une note OSM au milieu du sentier */
  /** Sans réseau, le lien ne mène nulle part : le GPX est alors lu dans le pack hors ligne. */
  protected async gpx(ev: MouseEvent): Promise<void> {
    if (navigator.onLine) return;
    ev.preventDefault();
    const res = await packFetch(`data/gpx/${this.rid()}.gpx`).catch(() => null);
    if (!res?.ok) return;
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: `ododino-${this.fileName()}.gpx` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected report(): string {
    const part = this.trail().coords[0], mid = part[Math.floor(part.length / 2)];
    return noteUrl(mid[1], mid[0]);
  }
}
