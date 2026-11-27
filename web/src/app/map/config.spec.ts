import { diffLevel, dist, lengthOf, safeUrl } from './config';

describe('config de la carte', () => {
  it('difficulté : cotation CAI d’abord, sinon SAC calculé', () => {
    expect(diffLevel({ cai_scale: 'E' })).toBe('easy');
    expect(diffLevel({ cai_scale: 'T' })).toBe('easy');
    expect(diffLevel({ cai_scale: 'EE' })).toBe('hard');
    expect(diffLevel({ cai_scale: 'EEA' })).toBe('alpine');
    expect(diffLevel({ cai_scale: 'EE', sac_max: 'T5' })).toBe('hard'); // le CAI prime
    expect(diffLevel({ sac_max: 'T2' })).toBe('easy');
    expect(diffLevel({ sac_max: 'T3' })).toBe('hard');
    expect(diffLevel({ sac_max: 'T4' })).toBe('alpine');
    expect(diffLevel({})).toBe('unknown');
  });

  it('distance : même haversine que geo.js (1° de latitude ≈ 111,2 km)', () => {
    expect(dist([13.5, 46], [13.5, 47])).toBeCloseTo(111195, -1);
    expect(lengthOf([[[13.5, 46], [13.5, 46.5], [13.5, 47]]])).toBeCloseTo(111195, -1);
  });

  it('liens OSM : http(s) seulement', () => {
    expect(safeUrl('www.example.it')).toBe('https://www.example.it/');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('')).toBe('');
  });
});
