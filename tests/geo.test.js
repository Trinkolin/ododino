// geo.js contre la fixture partagée (tests/geo-cases.json), la même que tests/test_geo.py.
// Lancer :  node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const geo = require('../geo.js');

const CASES = JSON.parse(fs.readFileSync(path.join(__dirname, 'geo-cases.json'), 'utf8'));
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg} : ${a} ≠ ${b}`);

test('distance', () => {
  for (const c of CASES.dist) close(geo.dist(c.a, c.b), c.m, 1e-3, JSON.stringify(c));
});

test('temps de marche', () => {
  for (const c of CASES.walking_minutes) assert.equal(geo.walkingMinutes(c.km, c.gain, c.loss), c.minutes, JSON.stringify(c));
});

test('statistiques d\'une série', () => {
  for (const c of CASES.stats) {
    const s = geo.stats(c.d, c.e);
    for (const k of ['gain', 'loss', 'min', 'max', 'km']) close(s[k], c[k], 1e-5, `${k} ${JSON.stringify(c.e)}`);
    assert.equal(s.minutes, c.minutes);
  }
});

test('rééchantillonnage', () => {
  for (const c of CASES.resample) {
    const { points, total } = geo.resample(c.line.map(([x, y]) => [x, y, null]));
    assert.equal(points.length, c.count);
    close(total, c.total, 1e-3, 'longueur');
    assert.equal(points[points.length - 1][0], total);
  }
});

test('points du graphique', () => {
  for (const c of CASES.downsample) {
    const idx = geo.downsample(c.n);
    assert.deepEqual([idx.length, idx[idx.length - 1]], [c.count, c.last]);
  }
});

test('profil : altitudes manquantes → longueur seulement', () => {
  const p = geo.profile([[13.5, 46.2, null], [13.5, 46.201, null]]);
  assert.equal(p.hasEle, false);
  close(p.total, 111.19, 0.01, 'longueur');
});

test('profil : pente régulière de 10 %', () => {
  const p = geo.profile([[13.5, 46.2, 500], [13.5, 46.209, 600.08]]);
  close(p.gain, 100, 3, 'montée');
  assert.equal(p.loss, 0);
});
