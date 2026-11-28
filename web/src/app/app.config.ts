import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { provideIcons } from './shell/icons';
import './shell/start-url'; // avant le démarrage : anciennes adresses index.html

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIcons(),
    // paramètres d'adresse (:slug…) passés directement aux composants
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // sans hydratation incrémentale ni rejeu d'événements : ils ajoutent des scripts dans la page, que la CSP
    // de src/index.html interdit
    provideClientHydration(withNoIncrementalHydration()),
    // service worker d'Angular (ngsw-config.json) : app installable et utilisable hors connexion
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
