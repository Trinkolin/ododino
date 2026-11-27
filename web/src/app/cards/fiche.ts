import { ResolveFn } from '@angular/router';
import { LOADERS } from './generated/loaders';
import INDEX from './generated/index.json';

/** Fiche phare telle que l'exporte tools/export_app.py (une par fichier, 5 langues). */
export interface Fiche {
  slug: string;
  draft: boolean;
  kind: 'intro' | 'place' | 'trail';
  osm: string | null;
  lonLat: [number, number] | null;
  altitude: number | null;
  photo: { src: string; width: number; height: number; author: string; license: string; licenseUrl: string; sourceUrl: string } | null;
  trails: { id: string; name: string; km: number | null; gain: number | null; loss: number | null; minutes: number | null; experts: boolean }[];
  sources: { title: string; url: string; consulted: string | null }[];
  updated: string;
  /** body : HTML produit par le Markdown réduit de tools/content.py (aucune balise venue du texte) */
  texts: Record<string, { title: string; description: string; alt: string; body: string }>;
}

/** Fiches publiées, fiche d'introduction (proposée en bas des autres), adresse publique du site */
export const FICHES: { slugs: string[]; intro: string | null; siteUrl: string } = INDEX;

/** La fiche est chargée avant l'affichage de la page : le pré-rendu attend donc son contenu. */
export const ficheResolver: ResolveFn<Fiche | null> = (route) => LOADERS[route.paramMap.get('slug') ?? '']?.() ?? null;
