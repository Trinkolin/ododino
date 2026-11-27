import { RenderMode, ServerRoute } from '@angular/ssr';
import { LANGS } from './i18n/i18n.service';
import { FICHES } from './cards/fiche';

// Site statique (GitHub Pages) : tout ce qui peut l'être est pré-rendu au build, une page par langue.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: ':lang', renderMode: RenderMode.Prerender, getPrerenderParams: async () => LANGS.map((lang) => ({ lang })) },
  { path: ':lang/about', renderMode: RenderMode.Prerender, getPrerenderParams: async () => LANGS.map((lang) => ({ lang })) },
  // Fiches phares : chacune dans les 5 langues (liste exportée de content/ par tools/export_app.py)
  { path: ':lang/:slug', renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => LANGS.flatMap((lang) => FICHES.slugs.map((slug) => ({ lang, slug }))) },
  // anciennes adresses : la redirection a besoin de ?lang= (pas de page statique)
  { path: 'about.html', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
