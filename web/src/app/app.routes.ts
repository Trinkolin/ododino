import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { I18nService, isLang } from './i18n/i18n.service';

/** /<langue>/… : langue connue → elle devient la langue courante ; sinon retour à la langue du visiteur. */
const langGuard: CanActivateFn = (route) => {
  const i18n = inject(I18nService);
  const lang = route.paramMap.get('lang');
  if (isLang(lang)) { i18n.use(lang); return true; }
  return inject(Router).createUrlTree(['/', i18n.detect()]);
};

export const routes: Routes = [
  // Racine : on envoie le visiteur dans sa langue (pré-rendue, la page propose aussi les 5 langues)
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home-redirect').then((m) => m.HomeRedirect) },
  {
    path: ':lang',
    canActivate: [langGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/map-page').then((m) => m.MapPage) },
      // Fiches phares : phase 4 de la migration
      { path: ':slug', loadComponent: () => import('./pages/card-page').then((m) => m.CardPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
