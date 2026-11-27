/**
 * Adresses de la version précédente du site : « …/index.html?lang=fr#poi=… ». Le routeur d'Angular récrit
 * /index.html en / au démarrage et perd la langue et le lieu ; on remet donc l'adresse sous la forme
 * « …/?lang=fr#poi=… » (gérée par HomeRedirect) avant que l'app ne démarre.
 * Importé par app.config.ts pour être évalué avant le démarrage.
 */
export const START_REWRITTEN = typeof location !== 'undefined' && /\/index\.html$/.test(location.pathname)
  && (history.replaceState(history.state, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash), true);
