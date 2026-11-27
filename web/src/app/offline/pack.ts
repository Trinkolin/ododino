import type * as Leaflet from 'leaflet';

/** Cache du pack hors ligne (Cache Storage), même nom que sur le site actuel */
export const PACK_CACHE = 'ododino-offline';

/**
 * Lecture d'un fichier du site : le réseau d'abord (données fraîches), le pack hors ligne s'il ne répond pas.
 * Les adresses relatives (« data/graph.json ») se résolvent contre <base href>, comme au téléchargement du pack.
 */
export async function packFetch(url: string): Promise<Response> {
  let res: Response | null = null, err: unknown = null;
  try { res = await fetch(url); if (res.ok) return res; } catch (e) { err = e; }
  if (typeof caches !== 'undefined') {
    const hit = await caches.match(url, { cacheName: PACK_CACHE }).catch(() => undefined);
    if (hit) return hit;
  }
  if (res) return res;
  throw err;
}

/**
 * Couche de tuiles images lues par packFetch : le relief ombré reste visible sans réseau une fois le pack
 * téléchargé (une balise <img> ordinaire ne passerait pas par le pack).
 */
export function packTileLayer(L: typeof Leaflet, url: string, options: Leaflet.TileLayerOptions): Leaflet.TileLayer {
  const Layer = L.TileLayer.extend({
    createTile(this: Leaflet.TileLayer, coords: Leaflet.Coords, done: Leaflet.DoneCallback): HTMLElement {
      const img = document.createElement('img');
      img.alt = ''; img.setAttribute('role', 'presentation');
      packFetch(this.getTileUrl(coords))
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
        .then((b) => {
          const src = URL.createObjectURL(b);
          img.onload = () => { URL.revokeObjectURL(src); done(undefined, img); };
          img.onerror = () => { URL.revokeObjectURL(src); done(new Error('image'), img); };
          img.src = src;
        })
        .catch((e) => done(e, img));
      return img;
    },
  });
  return new (Layer as unknown as new (u: string, o: Leaflet.TileLayerOptions) => Leaflet.TileLayer)(url, options);
}

/**
 * Fond vectoriel hors ligne (tiles/basemap.pmtiles), lu directement dans le pack : protomaps-leaflet lit le
 * fichier par morceaux, ce que le service worker d'Angular ne sait pas servir depuis son cache.
 * null tant que le pack n'est pas téléchargé.
 */
export async function packBasemap(L: typeof Leaflet): Promise<Leaflet.Layer | null> {
  if (typeof caches === 'undefined') return null;
  const hit = await caches.match('tiles/basemap.pmtiles', { cacheName: PACK_CACHE }).catch(() => undefined);
  if (!hit) return null;
  const file = new File([await hit.blob()], 'basemap.pmtiles');
  // protomaps-leaflet s'appuie sur la variable globale L de Leaflet
  (globalThis as unknown as { L: typeof Leaflet }).L = L;
  const [{ leafletLayer }, { PMTiles, FileSource }] = await Promise.all([import('protomaps-leaflet'), import('pmtiles')]);
  return leafletLayer({ url: new PMTiles(new FileSource(file)), flavor: 'light', maxDataZoom: 15,
    attribution: '© OpenStreetMap | Protomaps' }) as unknown as Leaflet.Layer;
}
