// Traductions (i18n.js) : les 5 langues doivent être complètes, et toute clé utilisée par une page ou
// un script doit exister. Sinon le site retomberait en silence sur l'italien, ou afficherait la clé.
// Lancer :  node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
global.window = {};
require(path.join(ROOT, 'i18n.js'));
const I = global.window.I18N;
const LANGS = I.LANGS.map((l) => l[0]);
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// toutes les clés, y compris imbriquées (cats.peak, nets.iwn…)
function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v)
    ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}
const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

test('les 5 langues ont exactement les mêmes clés', () => {
  const ref = new Set(keys(I.it));
  for (const l of LANGS) {
    const ks = new Set(keys(I[l]));
    const missing = [...ref].filter((k) => !ks.has(k));
    const extra = [...ks].filter((k) => !ref.has(k));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `langue « ${l} »`);
  }
});

test('aucune traduction vide', () => {
  for (const l of LANGS) for (const k of keys(I[l])) {
    const v = get(I[l], k);
    const empty = Array.isArray(v) ? v.some((x) => !String(x).trim()) : !String(v).trim();
    assert.ok(!empty, `${l}.${k} est vide`);
  }
});

test('les textes à trous gardent leurs trous dans chaque langue', () => {
  for (const k of keys(I.it)) {
    const holes = (s) => (String(s).match(/\{[a-z]+\}/g) || []).sort().join();
    const ref = holes(get(I.it, k));
    for (const l of LANGS) assert.equal(holes(get(I[l], k)), ref, `${l}.${k}`);
  }
});

test('toute clé utilisée par les pages et les scripts existe', () => {
  const used = new Set();
  for (const f of ['index.html', 'about.html']) {
    for (const m of read(f).matchAll(/data-i18n(?:-ph|-aria)?="([\w.]+)"/g)) used.add(m[1]);
  }
  for (const f of ['app.js', 'route.js', 'offline.js', 'about.js']) {
    for (const m of read(f).matchAll(/\bt\('([\w.]+)'\)/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => get(I.it, k) === undefined);
  assert.deepEqual(missing, [], 'clés utilisées mais absentes de i18n.js');
});

test('étiquettes des fiches (content/labels.json) : 5 langues complètes et non vides', () => {
  const labels = JSON.parse(read('content/labels.json'));
  assert.deepEqual(Object.keys(labels).sort(), [...LANGS].sort());
  const ref = Object.keys(labels.it).sort();
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(labels[l]).sort(), ref, `labels « ${l} »`);
    for (const k of ref) assert.ok(String(labels[l][k]).trim(), `labels.${l}.${k} est vide`);
  }
});
