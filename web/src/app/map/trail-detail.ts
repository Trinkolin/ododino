import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '../i18n/i18n.service';
import { ElevationProfile } from '../geo/elevation-profile';
import { ProfilePoints } from '../geo/geo';
import { Icon } from '../shell/icon';
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
  imports: [RouterLink, MatButtonModule, ElevationProfile, Icon],
  template: `
    @let t = trail();
    @let st = t.p['stats'];
    <div class="detail">
      <div class="head">
        <h3><span class="ref" [style.background]="state.trailColor(t)">{{ t.p['ref'] || '—' }}</span> {{ state.trailTitle(t.p) }}</h3>
        <button mat-icon-button (click)="state.clear()" [attr.aria-label]="i18n.t('close')"><odo-icon name="close" /></button>
      </div>
      <div class="row">
        <span>{{ i18n.t('length') }} <b>{{ i18n.num(st ? st.km : t.km, 1) }} km</b></span>
        @if (t.p['duration']) { <span>{{ i18n.t('durationCai') }} <b>{{ caiDuration() }}</b></span> }
        @else if (st) { <span>{{ i18n.t('timeEst') }} <b>{{ hm(st.minutes) }}</b></span> }
        <span>{{ i18n.t('difficulty') }} <b>{{ state.diffText(t.p) }}</b></span>
      </div>
      @if (st) {
        <div class="row">
          <span>{{ i18n.t('ascent') }} <b>{{ i18n.num(st.gain) }} m</b></span>
          <span>{{ i18n.t('descent') }} <b>{{ i18n.num(st.loss) }} m</b></span>
          <span>{{ i18n.t('altRange') }} <b>{{ i18n.num(st.min) }} – {{ i18n.num(st.max) }} m</b></span>
        </div>
      }
      <div class="row">
        @if (t.p['from']) { <span>{{ i18n.t('from') }} <b>{{ t.p['from'] }}</b></span> }
        @if (t.p['to']) { <span>{{ i18n.t('to') }} <b>{{ t.p['to'] }}</b></span> }
        <span>{{ i18n.t('network') }} <b>{{ i18n.t('nets.' + t.net) }}</b></span>
      </div>
      @if (profile(); as pr) {
        <odo-elevation-profile [pr]="pr" [color]="state.trailColor(t)" (hover)="state.map?.showPoint($event, state.trailColor(t))" />
      } @else if (!t.p['ordered']) {
        <p class="muted">{{ i18n.t('profileNA') }}</p>
      }
      @if (t.p['description']) { <p>{{ t.p['description'] }}</p> }
      @if (featured(); as f) {
        <a mat-flat-button class="read" [routerLink]="['/', i18n.lang(), f.slug]"><odo-icon name="menu_book" /> {{ i18n.t('readMore') }}</a>
      }
      <div class="actions">
        <button mat-stroked-button class="fav" (click)="favs.toggle(t.id)" [attr.aria-pressed]="favs.has(t.id)">
          <odo-icon [name]="favs.has(t.id) ? 'favorite' : 'favorite_border'" /> {{ i18n.t('fav') }}</button>
        <a mat-stroked-button [href]="'data/gpx/' + rid() + '.gpx'" [attr.download]="'ododino-' + fileName() + '.gpx'" (click)="gpx($event)">
          <odo-icon name="download" /> {{ i18n.t('gpx') }}</a>
      </div>
      <div class="links">
        <a [href]="'https://www.openstreetmap.org/' + t.id" target="_blank" rel="noopener">{{ i18n.t('viewOsm') }} ↗</a>
        @if (web()) { <a [href]="web()" target="_blank" rel="noopener noreferrer">{{ i18n.t('website') }} ↗</a> }
        <a class="report" [href]="report()" target="_blank" rel="noopener">⚑ {{ i18n.t('report') }}</a>
      </div>
    </div>
  `,
  styles: `
    .detail { border: 1px solid var(--mat-sys-outline-variant); border-radius: 14px; padding: 10px 12px; background: var(--mat-sys-surface-container-lowest); }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    h3 { margin: 4px 0; font: 600 16px/1.3 Fraunces, Georgia, serif; }
    .ref { color: #fff; border-radius: 6px; padding: 2px 7px; font: var(--mat-sys-label-medium); margin-right: 4px; }
    .row { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 4px 0; }
    .row b { color: var(--mat-sys-on-surface); }
    .muted { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    p { font: var(--mat-sys-body-small); }
    .read { margin: 6px 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    odo-icon { width: 18px; height: 18px; margin-right: 2px; }
    .fav odo-icon { color: #e03131; }
    .links { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font: var(--mat-sys-body-small); }
    .links a { color: var(--mat-sys-primary); }
    .links .report { color: #c92a2a; }
  `,
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
