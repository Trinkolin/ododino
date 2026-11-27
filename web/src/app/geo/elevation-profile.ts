import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { ProfilePoints } from './geo';

const W = 340, H = 120, L0 = 34, R0 = 6, T0 = 8, B0 = 18;

/** Profil d'altitude (SVG). Au survol ou au toucher : altitude et distance, et le point est montré sur la carte. */
@Component({
  selector: 'odo-elevation-profile',
  template: `
    @if (g(); as g) {
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="i18n.t('profileLabel')"
        (pointermove)="move($event)" (pointerdown)="move($event)" (pointerleave)="leave()">
        <polygon [attr.points]="g.area" [attr.fill]="color()" fill-opacity=".18" />
        <polyline [attr.points]="g.line" fill="none" [attr.stroke]="color()" stroke-width="2" stroke-linejoin="round" />
        <g class="ax">
          <text [attr.x]="L0 - 4" [attr.y]="g.yMax + 4" text-anchor="end">{{ g.eMax }}</text>
          <text [attr.x]="L0 - 4" [attr.y]="g.yMin + 4" text-anchor="end">{{ g.eMin }}</text>
          <text [attr.x]="L0" [attr.y]="H - 4">0</text>
          <text [attr.x]="W - R0" [attr.y]="H - 4" text-anchor="end">{{ g.total }}</text>
        </g>
        @if (cursor(); as c) {
          <line class="cursor" [attr.x1]="c.x" [attr.x2]="c.x" [attr.y1]="T0" [attr.y2]="H - B0" />
          <text class="cursor-lbl" [attr.x]="c.lx" [attr.y]="T0 + 10">{{ c.label }}</text>
        }
        <rect [attr.x]="L0" y="0" [attr.width]="W - L0 - R0" [attr.height]="H" fill="transparent" />
      </svg>
    }
  `,
  styles: `
    svg { width: 100%; height: auto; display: block; touch-action: pan-y; cursor: crosshair; }
    .ax text { font: 10px Inter, sans-serif; fill: var(--mat-sys-on-surface-variant); }
    .cursor { stroke: var(--mat-sys-on-surface); stroke-width: 1; stroke-dasharray: 3 3; }
    .cursor-lbl { font: 600 11px Inter, sans-serif; fill: var(--mat-sys-on-surface); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElevationProfile {
  protected readonly i18n = inject(I18nService);
  readonly pr = input.required<ProfilePoints>();
  readonly color = input('#0b7285');
  /** point survolé (null quand le pointeur quitte le graphique) */
  readonly hover = output<{ lat: number; lon: number } | null>();
  protected readonly W = W; protected readonly H = H; protected readonly L0 = L0; protected readonly R0 = R0; protected readonly T0 = T0; protected readonly B0 = B0;
  protected readonly cursor = signal<{ x: number; lx: number; label: string } | null>(null);

  private readonly scale = computed(() => {
    const pr = this.pr(), n = pr.d.length, dmax = pr.d[n - 1];
    const emin = Math.min(...pr.e), emax = Math.max(...pr.e);
    const pad = Math.max(20, (emax - emin) * 0.08), lo = emin - pad, hi = emax + pad;
    return { n, dmax, emin, emax, lo, X: (d: number) => L0 + (d / dmax) * (W - L0 - R0), Y: (e: number) => T0 + (1 - (e - lo) / (hi - lo)) * (H - T0 - B0) };
  });
  protected readonly g = computed(() => {
    const pr = this.pr(), s = this.scale();
    if (s.n < 2 || !s.dmax) return null;
    const line = pr.d.map((d, i) => `${s.X(d).toFixed(1)},${s.Y(pr.e[i]).toFixed(1)}`).join(' ');
    const base = s.Y(s.lo).toFixed(1);
    return { line, area: `${s.X(0)},${base} ${line} ${s.X(s.dmax)},${base}`, yMax: s.Y(s.emax), yMin: s.Y(s.emin),
      eMax: Math.round(s.emax), eMin: Math.round(s.emin), total: `${this.i18n.num(s.dmax / 1000, 1)} km` };
  });

  protected move(ev: PointerEvent): void {
    const pr = this.pr(), s = this.scale();
    const r = (ev.currentTarget as SVGSVGElement).getBoundingClientRect();
    const d = Math.max(0, Math.min(s.dmax, (((ev.clientX - r.left) / r.width) * W - L0) / (W - L0 - R0) * s.dmax));
    let i = pr.d.findIndex((v) => v >= d); if (i < 0) i = s.n - 1;
    const x = s.X(pr.d[i]);
    this.cursor.set({ x, lx: Math.min(x + 4, W - 110), label: `${Math.round(pr.e[i])} m · ${this.i18n.num(pr.d[i] / 1000, 1)} km` });
    this.hover.emit({ lat: pr.lat[i], lon: pr.lon[i] });
  }
  protected leave(): void { this.cursor.set(null); this.hover.emit(null); }
}
