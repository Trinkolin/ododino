/* Routeur du traceur d'itinéraire : calcul pur, sans carte ni page (portage fidèle de ../../../../router.js).
   const r = createRouter(graph)        // graph = contenu de data/graph.json (tools/build_graph.py)
   r.snap(lon, lat, options)  → carrefour le plus proche utilisable (ou -1 au-delà de 800 m)
   r.plan(points, options)    → { legs, coords, maxSac, failed }
   encodeRoute / decodeRoute  → lien partageable
   options = { marked: sentiers balisés uniquement, alpine: autoriser SAC T4 et plus }.
   Règles de sécurité vérifiées par router.spec.ts (mêmes cas que tests/router.test.js). */
import { dist, rawMinutes } from './geo';

const CLASS_FACTOR = [1, 1.05, 1.2, 1.6, 3]; // sentier, piste, petite route, tertiaire, secondaire (cf. build_graph.CLS)
const MARKED_BONUS = 0.9;                     // léger avantage aux sentiers balisés
const SNAP_M = 800;                           // distance max. entre un clic et un chemin
const CELL = 0.005;                           // grille de recherche du carrefour le plus proche (°)
export const MAX_POINTS = 50;

export interface RouteOptions { marked?: boolean; alpine?: boolean; }
export interface Graph { nodes: number[]; edges: number[][]; }
interface Edge { a: number; b: number; cls: number; sac: number; mk: number; len: number; gain: number; loss: number; pts: number[][]; }
/** [indice d'arête, sens direct] */
export type Leg = [number, boolean][] | null;
/** [lon, lat, altitude, SAC de l'arête] */
export type RouteCoord = [number, number, number, number];
export interface PlanResult { legs: Leg[]; coords: RouteCoord[]; maxSac: number; failed: boolean; }
export interface Router {
  snap(lon: number, lat: number, o?: RouteOptions): number;
  plan(points: number[], o?: RouteOptions): PlanResult;
  lonLat(i: number): [number, number];
  nodeCount: number;
}

const allowed = (e: Edge, o: RouteOptions): boolean => (!o.marked || !!e.mk) && (!!o.alpine || e.sac < 4);

// Coût d'une arête dans un sens : temps de marche brut (min) × type de voie, bonus aux balisés
function cost(e: Edge, fwd: boolean): number {
  const c = rawMinutes(e.len / 1000, fwd ? e.gain : e.loss, fwd ? e.loss : e.gain) * CLASS_FACTOR[e.cls];
  return e.mk ? c * MARKED_BONUS : c;
}

export function createRouter(raw: Graph): Router {
  const n = raw.nodes.length / 2;
  const lon = new Float64Array(n), lat = new Float64Array(n);
  for (let i = 0; i < n; i++) { lon[i] = raw.nodes[2 * i] / 1e5; lat[i] = raw.nodes[2 * i + 1] / 1e5; }
  const adj: number[][] = Array.from({ length: n }, () => []);
  const edges: Edge[] = raw.edges.map((e, k) => {
    const [a, b, cls, sac, mk, len, gain, loss] = e;
    const pts: number[][] = []; let x = raw.nodes[2 * a], y = raw.nodes[2 * a + 1];
    for (let i = 8; i < e.length; i += 3) { x += e[i]; y += e[i + 1]; pts.push([x / 1e5, y / 1e5, e[i + 2]]); }
    adj[a].push(k); if (b !== a) adj[b].push(k);
    return { a, b, cls, sac, mk, len, gain, loss, pts };
  });
  const grid = new Map<string, number[]>(), cellOf = (x: number, y: number) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
  for (let i = 0; i < n; i++) { const c = cellOf(lon[i], lat[i]); if (!grid.has(c)) grid.set(c, []); grid.get(c)!.push(i); }

  function snap(x: number, y: number, o: RouteOptions = {}): number {
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let best = -1, bestD = SNAP_M;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      for (const i of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
        if (!adj[i].some((k) => allowed(edges[k], o))) continue;
        const d = dist([x, y], [lon[i], lat[i]]);
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  // A* avec tas binaire ; heuristique admissible : vol d'oiseau à 4 km/h, bonus des balisés déduit
  function shortest(s: number, goal: number, o: RouteOptions): Leg {
    if (s === goal) return [];
    const g = new Float64Array(n).fill(Infinity), via = new Int32Array(n).fill(-1);
    const gx = [lon[goal], lat[goal]];
    const h = (i: number) => (dist([lon[i], lat[i]], gx) / 1000 / 4) * 60 * MARKED_BONUS;
    const heap: [number, number][] = [[h(s), s]];
    const push = (it: [number, number]) => {
      heap.push(it); let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop()!;
      if (heap.length) {
        heap[0] = last; let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
      }
      return top;
    };
    g[s] = 0;
    while (heap.length) {
      const [, u] = pop();
      if (u === goal) break;
      for (const k of adj[u]) {
        const e = edges[k]; if (!allowed(e, o)) continue;
        const fwd = e.a === u, v = fwd ? e.b : e.a, nd = g[u] + cost(e, fwd);
        if (nd < g[v]) { g[v] = nd; via[v] = k; push([nd + h(v), v]); }
      }
    }
    if (g[goal] === Infinity) return null;
    const path: [number, boolean][] = []; let v = goal;
    while (v !== s) { const k = via[v], e = edges[k], fwd = e.b === v; path.push([k, fwd]); v = fwd ? e.a : e.b; }
    return path.reverse();
  }

  /** Itinéraire passant par les carrefours `points` (dans l'ordre). Une étape introuvable vaut null
      dans `legs` et met `failed` à vrai ; `coords` = [[lon, lat, ele, sac]] des étapes trouvées. */
  function plan(points: number[], o: RouteOptions = {}): PlanResult {
    const legs: Leg[] = [];
    for (let i = 1; i < points.length; i++) legs.push(shortest(points[i - 1], points[i], o));
    const coords: RouteCoord[] = [];
    let maxSac = 0;
    for (const leg of legs) for (const [k, fwd] of leg ?? []) {
      const e = edges[k], pts = fwd ? e.pts : [...e.pts].reverse();
      maxSac = Math.max(maxSac, e.sac);
      pts.forEach((p, j) => { if (!(coords.length && j === 0)) coords.push([p[0], p[1], p[2], e.sac]); });
    }
    return { legs, coords, maxSac, failed: legs.some((l) => l === null) };
  }

  return { snap, plan, lonLat: (i) => [lon[i], lat[i]], nodeCount: n };
}

// ---------- Lien partageable : « lon,lat;lon,lat…&o=ma » ----------
export function encodeRoute(lonLats: number[][], o: RouteOptions = {}): string {
  const flags = `${o.marked ? 'm' : ''}${o.alpine ? 'a' : ''}`;
  return lonLats.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join(';') + (flags ? `&o=${flags}` : '');
}
export function decodeRoute(text: string): { lonLats: number[][]; options: Required<RouteOptions> } {
  const [pts, o = ''] = String(text).split('&o=');
  const lonLats = pts.split(';').map((s) => s.split(',').map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)
    .slice(0, MAX_POINTS);
  return { lonLats, options: { marked: o.includes('m'), alpine: o.includes('a') } };
}
