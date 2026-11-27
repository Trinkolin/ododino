// Configuration de la carte, reprise telle quelle du site actuel (app.js) pour garder les mêmes couleurs et règles.

export type Cat = keyof typeof CATS;
export const CATS = {
  peak: { color: '#7a5230', icon: '▲' }, viewpoint: { color: '#e8590c', icon: '👁' },
  church: { color: '#5f3dc4', icon: '✝' }, shrine: { color: '#9775fa', icon: '✟' },
  history: { color: '#a61e4d', icon: '🏛' }, culture: { color: '#c2255c', icon: '★' },
  cave: { color: '#495057', icon: '◐' }, water: { color: '#1c7ed6', icon: '💧' },
  drinking: { color: '#0c8599', icon: '🚰' },
  hut: { color: '#2b8a3e', icon: '⌂' }, outdoor: { color: '#5c940d', icon: '⛺' },
  food: { color: '#f08c00', icon: '🍴' }, sleep: { color: '#0b7285', icon: '🛏' },
  info: { color: '#868e96', icon: 'i' }, saddle: { color: '#8d6e52', icon: '⌒' },
  train: { color: '#1864ab', icon: '🚆' }, bus: { color: '#3b5bdb', icon: '🚌' },
  parking: { color: '#4263eb', icon: 'P' },
} as const;
/** Masquées au départ : nombreuses, utiles seulement pour préparer l'accès. */
export const HIDDEN_BY_DEFAULT: Cat[] = ['parking', 'bus'];
/** Secondaires : masquées sur la carte quand on regarde toute la zone (zoom < 13). */
export const MINOR: Cat[] = ['info', 'food', 'sleep', 'outdoor', 'drinking', 'shrine', 'saddle', 'bus', 'parking'];

export type Net = keyof typeof NETS;
export const NETS = {
  iwn: { color: '#e8590c', order: 0 }, nwn: { color: '#7048e8', order: 1 },
  rwn: { color: '#f59f00', order: 2 }, lwn: { color: '#d6336c', order: 3 },
} as const;

export const SAC: Record<string, string> = {
  hiking: 'T1', mountain_hiking: 'T2', demanding_mountain_hiking: 'T3',
  alpine_hiking: 'T4', demanding_alpine_hiking: 'T5', difficult_alpine_hiking: 'T6',
};

/** Difficulté d'un sentier : cotation CAI si OSM la donne, sinon le tronçon le plus dur (SAC calculé). */
export type Diff = keyof typeof DIFF;
export const DIFF = { easy: '#2f9e44', hard: '#e8590c', alpine: '#c92a2a', unknown: '#868e96' } as const;
export function diffLevel(p: { cai_scale?: string; sac_max?: string }): Diff {
  const c = p.cai_scale;
  if (c) return /^EEA/.test(c) ? 'alpine' : c === 'EE' ? 'hard' : 'easy';
  const s = Number(String(p.sac_max ?? '').replace('T', ''));
  return !s ? 'unknown' : s <= 2 ? 'easy' : s === 3 ? 'hard' : 'alpine';
}

/** Distance en mètres entre deux points [lon, lat] (haversine) : même formule que geo.js / tools/geo.py. */
export function dist(a: number[], b: number[]): number {
  const p1 = a[1] * Math.PI / 180, p2 = b[1] * Math.PI / 180;
  const dp = p2 - p1, dl = (b[0] - a[0]) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371e3 * Math.asin(Math.sqrt(h));
}
export const lengthOf = (parts: number[][][]): number =>
  parts.reduce((s, p) => s + p.slice(1).reduce((u, c, i) => u + dist(p[i], c), 0), 0);
export const hm = (min: number): string => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
export const noteUrl = (lat: number, lon: number): string =>
  `https://www.openstreetmap.org/note/new?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}#map=17/${lat.toFixed(5)}/${lon.toFixed(5)}`;

/** Lien externe venu d'OSM (modifiable par tous) : seulement http(s) ; « www.x.it » devient https://. */
export function safeUrl(u: unknown): string {
  const s = String(u ?? '').trim();
  if (!s) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : 'https://' + s;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}
export const norm = (s: unknown): string => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
