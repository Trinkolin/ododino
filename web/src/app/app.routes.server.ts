import { RenderMode, ServerRoute } from '@angular/ssr';
import { LANGS } from './i18n/i18n.service';

// Site statique (GitHub Pages) : tout ce qui peut l'être est pré-rendu au build, une page par langue.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: ':lang', renderMode: RenderMode.Prerender, getPrerenderParams: async () => LANGS.map((lang) => ({ lang })) },
  // Fiches : pré-rendues en phase 4 (liste des fiches lue dans content/)
  { path: ':lang/:slug', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
