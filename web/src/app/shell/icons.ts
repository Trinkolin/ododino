import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_SVGS } from './icons.generated';

/**
 * Icônes Material Symbols pour <mat-icon svgIcon="…"> : SVG intégrés au build (scripts/prepare.mjs), sans police
 * d'icônes ni téléchargement — compatible avec la CSP, le pré-rendu et le hors-ligne.
 */
export function provideIcons(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const registry = inject(MatIconRegistry), sanitizer = inject(DomSanitizer);
    for (const [name, svg] of Object.entries(ICON_SVGS)) {
      registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg)); // SVG du dépôt, pas de données externes
    }
  });
}
