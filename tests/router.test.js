// router.js : règles de sécurité et de calcul du traceur, sur un petit graphe construit à la main.
// Lancer :  node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const geo = require('../geo.js');
const OdoRouter = require('../router.js');

//            C (sentier T2, non balisé)
//          /   \
//   A ———————————— B      A–B direct : passage alpin T4 (le plus court)
//          \   /
//            D (sentier balisé, T3)
//   F : relié à B seulement par un passage T5
//   E : relié à A seulement par une piste non balisée
const P = {
  A: [13.500, 46.200], B: [13.510, 46.200], C: [13.505, 46.204], D: [13.505, 46.196],
  E: [13.495, 46.200], F: [13.515, 46.200],
};
const NAMES = Object.keys(P);
const idx = (n) => NAMES.indexOf(n);

function edge(a, b, { cls = 0, sac = 0, mk = 0 } = {}) {
  const pa = P[a], pb = P[b];
  const x0 = Math.round(pa[0] * 1e5), y0 = Math.round(pa[1] * 1e5);
  const x1 = Math.round(pb[0] * 1e5), y1 = Math.round(pb[1] * 1e5);
  return [idx(a), idx(b), cls, sac, mk, Math.round(geo.dist(pa, pb)), 0, 0, 0, 0, 500, x1 - x0, y1 - y0, 500];
}
const GRAPH = {
  v: 1,
  nodes: NAMES.flatMap((n) => [Math.round(P[n][0] * 1e5), Math.round(P[n][1] * 1e5)]),
  edges: [
    edge('A', 'B', { sac: 4 }),
    edge('A', 'C', { sac: 2 }), edge('C', 'B', { sac: 2 }),
    edge('A', 'D', { sac: 3, mk: 1 }), edge('D', 'B', { sac: 3, mk: 1 }),
    edge('A', 'E', { cls: 1 }),
    edge('B', 'F', { sac: 5 }),
  ],
};
const r = OdoRouter.create(GRAPH);
const at = (n, o) => r.snap(P[n][0], P[n][1], o);
const passesBy = (res, n) => res.coords.some(([x, y]) => Math.abs(x - P[n][0]) < 1e-6 && Math.abs(y - P[n][1]) < 1e-6);

test('par défaut, le passage alpin T4 est évité', () => {
  const res = r.plan([at('A'), at('B')]);
  assert.equal(res.failed, false);
  assert.ok(res.maxSac < 4, `maxSac = ${res.maxSac}`);
  assert.ok(!passesBy(res, 'F'));
});

test('le détour balisé est préféré, et son T3 est signalé', () => {
  const res = r.plan([at('A'), at('B')]);
  assert.ok(passesBy(res, 'D'), 'devrait passer par D (balisé)');
  assert.equal(res.maxSac, 3);
});

test('passages alpins autorisés : le raccourci T4 est pris', () => {
  const res = r.plan([at('A', { alpine: true }), at('B', { alpine: true })], { alpine: true });
  assert.equal(res.maxSac, 4);
  assert.ok(!passesBy(res, 'C') && !passesBy(res, 'D'));
});

test('sentiers balisés uniquement : on reste sur le balisé', () => {
  const o = { marked: true };
  const res = r.plan([at('A', o), at('B', o)], o);
  assert.ok(passesBy(res, 'D'));
  assert.ok(!passesBy(res, 'C'));
});

test('un clic ne s\'accroche jamais à un carrefour atteignable seulement par un passage interdit', () => {
  // F n'est relié que par un T5 : le clic est recalé sur le carrefour autorisé le plus proche (B)
  assert.equal(at('F'), idx('B'));
  // E n'est relié que par une piste non balisée : en mode « balisés uniquement », recalé sur A
  assert.equal(at('E', { marked: true }), idx('A'));
  assert.equal(at('F', { alpine: true }), idx('F'));
});

test('étape impossible : failed, et le reste du tracé est gardé', () => {
  const res = r.plan([idx('E'), idx('A'), idx('F')]); // A→F exige le T5, interdit par défaut
  assert.equal(res.failed, true);
  assert.equal(res.legs[1], null);
  assert.ok(res.legs[0].length > 0);
});

test('clic trop loin de tout chemin', () => {
  assert.equal(r.snap(13.6, 46.3), -1);
});

test('lien partageable : aller-retour et entrées invalides', () => {
  const text = OdoRouter.encode([P.A, P.B], { marked: true, alpine: true });
  assert.equal(text, '13.50000,46.20000;13.51000,46.20000&o=ma');
  assert.deepEqual(OdoRouter.decode(text), { lonLats: [P.A, P.B], options: { marked: true, alpine: true } });
  assert.deepEqual(OdoRouter.decode('x,y;999,1;13.5,46.2').lonLats, [[13.5, 46.2]]);
  const many = Array.from({ length: 80 }, () => '13.5,46.2').join(';');
  assert.equal(OdoRouter.decode(many).lonLats.length, OdoRouter.MAX_POINTS);
});
