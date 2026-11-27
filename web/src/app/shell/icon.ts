import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Icône Material Symbols, dessinée dans la couleur du texte (masque CSS sur public/m/<nom>.svg).
 * Rien à télécharger à l'exécution : marche pré-rendue et hors connexion. Liste des icônes :
 * scripts/prepare.mjs.
 */
@Component({
  selector: 'odo-icon',
  template: '',
  host: { 'aria-hidden': 'true', '[style.--odo-icon]': 'url()' },
  styles: `:host { display: inline-block; width: 1.5em; height: 1.5em; flex: none; vertical-align: middle;
    background: currentColor; -webkit-mask: var(--odo-icon) center / contain no-repeat; mask: var(--odo-icon) center / contain no-repeat; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<string>();
  protected readonly url = computed(() => `url(m/${this.name()}.svg)`);
}
