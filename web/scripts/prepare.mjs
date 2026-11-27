// Préparation avant chaque build Angular (npm « prebuild » / « prestart ») :
//  1. traductions : ../i18n.js reste la seule source ; on en tire src/app/i18n/messages.generated.ts
//  2. icônes : seules les icônes Material Symbols utilisées sont copiées dans public/m/ (quelques Ko),
//     au lieu d'une police d'icônes de plusieurs Mo
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(here, '..');
const root = path.join(web, '..');

// ---------- 1. Traductions ----------
const ctx = { window: {}, navigator: { languages: [], language: 'it' }, localStorage: undefined };
vm.runInNewContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), ctx);
const I = ctx.window.I18N;
const langs = I.LANGS.map((l) => l[0]);
const out = {
  langs: I.LANGS.map(([code, label]) => ({ code, label })),
  contact: I.CONTACT,
  timetableUrl: I.TIMETABLE_URL,
  messages: Object.fromEntries(langs.map((l) => [l, I[l]])),
};
const target = path.join(web, 'src', 'app', 'i18n', 'messages.generated.ts');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target,
  '// Généré par scripts/prepare.mjs depuis ../i18n.js — ne pas modifier à la main.\n'
  + `export const I18N = ${JSON.stringify(out, null, 1)} as const;\n`);

// ---------- 2. Icônes ----------
// Ajouter ici le nom Material Symbols d'une nouvelle icône (https://fonts.google.com/icons), puis relancer.
const ICONS = [
  'explore', 'location_on', 'hiking', 'route', 'download', 'download_done', 'translate', 'install_desktop', 'mobile',
  'favorite', 'favorite_border', 'close', 'my_location', 'fit_screen', 'search', 'menu_book',
  'add_location_alt', 'layers', 'info', 'arrow_back', 'tune', 'map',
];
const src = path.join(web, 'node_modules', '@material-symbols', 'svg-400', 'outlined');
const dest = path.join(web, 'public', 'm');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const name of ICONS) {
  // favorite_border n'existe plus dans Material Symbols : c'est « favorite » non rempli
  const file = name === 'favorite_border' ? 'favorite.svg' : name === 'favorite' ? 'favorite-fill.svg' : `${name}.svg`;
  fs.copyFileSync(path.join(src, file), path.join(dest, `${name}.svg`));
}
// ---------- 3. Fichiers du site partagés avec les outils Python ----------
// Angular n'accepte que des fichiers sous web/ : copie de data/, fonts/, tiles/ et icons/ dans web/.site/
// (ignoré par git), déclaré dans angular.json.
const site = path.join(web, '.site');
fs.rmSync(site, { recursive: true, force: true });
for (const dir of ['data', 'fonts', 'tiles', 'icons']) {
  fs.cpSync(path.join(root, dir), path.join(site, dir), { recursive: true });
}
// ---------- 4. Fiches : index pour la carte, liste « Découvrir », vignettes (tools/export_app.py) ----------
// Python s'appelle « py » sous Windows, « python3 » ou « python » ailleurs (GitHub Actions).
const pythons = process.platform === 'win32' ? ['py', 'python'] : ['python3', 'python'];
// Fiches (une par fichier JSON) dans src/app/cards/generated/ (ignoré par git) ; ODODINO_DRAFTS=1 ajoute les brouillons.
const fiches = path.join(web, 'src', 'app', 'cards', 'generated');
const exportArgs = [path.join(root, 'tools', 'export_app.py'), site, fiches, ...(process.env.ODODINO_DRAFTS ? ['--drafts'] : [])];
const ok = pythons.some((py) => spawnSync(py, exportArgs, { cwd: root, stdio: 'inherit' }).status === 0);
if (!ok) { console.error('tools/export_app.py a échoué (Python 3 introuvable ?)'); process.exit(1); }
// Chargeurs : chaque fiche est un morceau JS à part, chargé seulement quand on l'ouvre (et au pré-rendu)
const { slugs } = JSON.parse(fs.readFileSync(path.join(fiches, 'index.json'), 'utf8'));
fs.writeFileSync(path.join(fiches, 'loaders.ts'), [
  '// Généré par scripts/prepare.mjs : ne pas modifier.',
  "import type { Fiche } from '../fiche';",
  'export const LOADERS: Record<string, () => Promise<Fiche>> = {',
  ...slugs.map((s) => `  '${s}': () => import('./${s}.json').then((m) => m.default as unknown as Fiche),`),
  '};', ''].join('\n'));

// ---------- 5. Pack hors ligne : liste des fichiers, tailles, version (web/.site/data/offline-files.json) ----------
// Téléchargé à la demande par l'onglet « Hors ligne » (src/app/offline/) et gardé par l'app elle-même (Cache Storage) :
// le service worker d'Angular ne sait pas servir les lectures partielles (Range) du fond vectoriel PMTiles.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const rel = (f) => path.relative(site, f).split(path.sep).join('/');
const PACK = [
  ...walk(path.join(site, 'data')).filter((f) => /\.(geojson|json|gpx)$/.test(f) && !f.endsWith('offline-files.json')),
  path.join(site, 'tiles', 'basemap.pmtiles'),
  // vignettes de « Découvrir » et photos des fiches
  ...walk(path.join(site, 'cards')).filter((f) => f.endsWith('.jpg')),
  ...walk(path.join(site, 'tiles', 'hillshade')).filter((f) => f.endsWith('.png')),
].sort();
const hash = crypto.createHash('sha256');
const packFiles = PACK.map((f) => { const buf = fs.readFileSync(f); hash.update(rel(f)).update(buf); return [rel(f), buf.length]; });
const pack = { version: hash.digest('hex').slice(0, 16), bytes: packFiles.reduce((n, [, b]) => n + b, 0), files: packFiles };
fs.writeFileSync(path.join(site, 'data', 'offline-files.json'), JSON.stringify(pack));
console.log(`pack hors ligne : ${packFiles.length} fichiers, ${(pack.bytes / 1e6).toFixed(1)} Mo`);

console.log(`i18n : ${langs.length} langues · icônes : ${ICONS.length} · fichiers du site copiés dans web/.site/`);
