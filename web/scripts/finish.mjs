// Après le build (npm run build / build:pages) : ce que GitHub Pages attend en plus de la sortie d'Angular.
//  - 404.html : coquille de l'app (sans pré-rendu) pour toute adresse inconnue, qui passe alors par le routeur ;
//  - .nojekyll : fichiers servis tels quels.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'ododino', 'browser');
fs.copyFileSync(path.join(out, 'index.csr.html'), path.join(out, '404.html'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('404.html et .nojekyll ajoutés');
