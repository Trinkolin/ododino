// Règles de sécurité et de calcul du traceur, sur un petit graphe construit à la main
// (mêmes cas que tests/router.test.js pour router.js).
import { dist } from './geo';
import { MAX_POINTS, PlanResult, RouteOptions, createRouter, decodeRoute, encodeRoute } from './router';

//            C (sentier T2, non balisé)
//          /   \
//   A ———————————— B      A–B direct : passage alpin T4 (le plus court)
//          \   /
//            D (sentier balisé, T3)
//   F : relié à B seulement par un passage T5
//   E : relié à A seulement par une piste non balisée
const P: Record<string, [number, number]> = {
  A: [13.500, 46.200], B: [13.510, 46.200], C: [13.505, 46.204], D: [13.505, 46.196],
  E: [13.495, 46.200], F: [13.515, 46.200],
};
const NAMES = Object.keys(P);
const idx = (n: string) => NAMES.indexOf(n);
function edge(a: string, b: string, { cls = 0, sac = 0, mk = 0 } = {}): number[] {
  const pa = P[a], pb = P[b];
  const x0 = Math.round(pa[0] * 1e5), y0 = Math.round(pa[1] * 1e5);
  const x1 = Math.round(pb[0] * 1e5), y1 = Math.round(pb[1] * 1e5);
  return [idx(a), idx(b), cls, sac, mk, Math.round(dist(pa, pb)), 0, 0, 0, 0, 500, x1 - x0, y1 - y0, 500];
}
const r = createRouter({
  nodes: NAMES.flatMap((n) => [Math.round(P[n][0] * 1e5), Math.round(P[n][1] * 1e5)]),
  edges: [
    edge('A', 'B', { sac: 4 }),
    edge('A', 'C', { sac: 2 }), edge('C', 'B', { sac: 2 }),
    edge('A', 'D', { sac: 3, mk: 1 }), edge('D', 'B', { sac: 3, mk: 1 }),
    edge('A', 'E', { cls: 1 }),
    edge('B', 'F', { sac: 5 }),
  ],
});
const at = (n: string, o?: RouteOptions) => r.snap(P[n][0], P[n][1], o);
const passesBy = (res: PlanResult, n: string) => res.coords.some(([x, y]) => Math.abs(x - P[n][0]) < 1e-6 && Math.abs(y - P[n][1]) < 1e-6);

describe('traceur (mêmes règles que router.js)', () => {
  it('par défaut, le passage alpin T4 est évité', () => {
    const res = r.plan([at('A'), at('B')]);
    expect(res.failed).toBe(false);
    expect(res.maxSac).toBeLessThan(4);
    expect(passesBy(res, 'F')).toBe(false);
  });
  it('le détour balisé est préféré, et son T3 est signalé', () => {
    const res = r.plan([at('A'), at('B')]);
    expect(passesBy(res, 'D')).toBe(true);
    expect(res.maxSac).toBe(3);
  });
  it('passages alpins autorisés : le raccourci T4 est pris', () => {
    const res = r.plan([at('A', { alpine: true }), at('B', { alpine: true })], { alpine: true });
    expect(res.maxSac).toBe(4);
    expect(passesBy(res, 'C') || passesBy(res, 'D')).toBe(false);
  });
  it('sentiers balisés uniquement : on reste sur le balisé', () => {
    const o = { marked: true };
    const res = r.plan([at('A', o), at('B', o)], o);
    expect(passesBy(res, 'D')).toBe(true);
    expect(passesBy(res, 'C')).toBe(false);
  });
  it('un clic ne s’accroche jamais à un carrefour atteignable seulement par un passage interdit', () => {
    expect(at('F')).toBe(idx('B'));
    expect(at('E', { marked: true })).toBe(idx('A'));
    expect(at('F', { alpine: true })).toBe(idx('F'));
  });
  it('étape impossible : failed, et le reste du tracé est gardé', () => {
    const res = r.plan([idx('E'), idx('A'), idx('F')]);
    expect(res.failed).toBe(true);
    expect(res.legs[1]).toBeNull();
    expect(res.legs[0]!.length).toBeGreaterThan(0);
  });
  it('clic trop loin de tout chemin', () => { expect(r.snap(13.6, 46.3)).toBe(-1); });
  it('lien partageable : aller-retour et entrées invalides', () => {
    const text = encodeRoute([P['A'], P['B']], { marked: true, alpine: true });
    expect(text).toBe('13.50000,46.20000;13.51000,46.20000&o=ma');
    expect(decodeRoute(text)).toEqual({ lonLats: [P['A'], P['B']], options: { marked: true, alpine: true } });
    expect(decodeRoute('x,y;999,1;13.5,46.2').lonLats).toEqual([[13.5, 46.2]]);
    const many = Array.from({ length: 80 }, () => '13.5,46.2').join(';');
    expect(decodeRoute(many).lonLats.length).toBe(MAX_POINTS);
  });
});
