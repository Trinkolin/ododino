// geo.ts contre la fixture partagée (tests/geo-cases.json), la même que tests/geo.test.js et tests/test_geo.py.
import CASES from '../../../../tests/geo-cases.json';
import { Coord, downsample, dist, profile, resample, stats, walkingMinutes } from './geo';

const close = (a: number, b: number, eps: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('geo (mêmes cas que geo.js et geo.py)', () => {
  it('distance', () => { for (const c of CASES.dist) close(dist(c.a, c.b), c.m, 1e-3); });
  it('temps de marche', () => {
    for (const c of CASES.walking_minutes) expect(walkingMinutes(c.km, c.gain, c.loss)).toBe(c.minutes);
  });
  it('statistiques d’une série', () => {
    for (const c of CASES.stats) {
      const s = stats(c.d, c.e);
      for (const k of ['gain', 'loss', 'min', 'max', 'km'] as const) close(s[k], c[k], 1e-5);
      expect(s.minutes).toBe(c.minutes);
    }
  });
  it('rééchantillonnage', () => {
    for (const c of CASES.resample) {
      const { points, total } = resample(c.line.map(([x, y]: number[]) => [x, y, null] as Coord));
      expect(points.length).toBe(c.count);
      close(total, c.total, 1e-3);
      expect(points[points.length - 1][0]).toBe(total);
    }
  });
  it('points du graphique', () => {
    for (const c of CASES.downsample) {
      const idx = downsample(c.n);
      expect([idx.length, idx[idx.length - 1]]).toEqual([c.count, c.last]);
    }
  });
  it('profil : altitudes manquantes → longueur seulement', () => {
    const p = profile([[13.5, 46.2, null], [13.5, 46.201, null]]);
    expect(p.hasEle).toBe(false);
    close(p.total, 111.19, 0.01);
  });
  it('profil : pente régulière de 10 %', () => {
    const p = profile([[13.5, 46.2, 500], [13.5, 46.209, 600.08]]);
    if (!p.hasEle) throw new Error('altitudes attendues');
    close(p.gain, 100, 3);
    expect(p.loss).toBe(0);
  });
});
