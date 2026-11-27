import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { I18nService } from '../i18n/i18n.service';
import { Icon } from '../shell/icon';

/**
 * Page principale : panneau à onglets + carte. Phase 1 de la migration : la structure seulement ;
 * la carte Leaflet, les listes et le traceur arrivent en phases 2 et 3.
 */
@Component({
  selector: 'odo-map-page',
  imports: [MatTabsModule, Icon],
  template: `
    <aside class="panel">
      <mat-tab-group mat-stretch-tabs="false" mat-align-tabs="start" animationDuration="0ms">
        <mat-tab><ng-template mat-tab-label><odo-icon name="explore" />{{ i18n.t('tabDiscover') }}</ng-template>
          <p class="todo">Phase 2</p></mat-tab>
        <mat-tab><ng-template mat-tab-label><odo-icon name="location_on" />{{ i18n.t('tabPois') }}</ng-template>
          <p class="todo">Phase 2</p></mat-tab>
        <mat-tab><ng-template mat-tab-label><odo-icon name="hiking" />{{ i18n.t('tabTrails') }}</ng-template>
          <p class="todo">Phase 3</p></mat-tab>
        <mat-tab><ng-template mat-tab-label><odo-icon name="route" />{{ i18n.t('tabRoute') }}</ng-template>
          <p class="todo">Phase 3</p></mat-tab>
        <mat-tab><ng-template mat-tab-label><odo-icon name="download" /><span class="sr">{{ i18n.t('offline') }}</span></ng-template>
          <p class="todo">Phase 5</p></mat-tab>
      </mat-tab-group>
    </aside>
    <section class="map" [attr.aria-label]="i18n.t('map')"><p class="todo">Carte : phase 2</p></section>
  `,
  styles: `
    :host { display: flex; height: 100%; min-height: 0; }
    .panel { width: 400px; flex: none; border-right: 1px solid var(--mat-sys-outline-variant); background: var(--mat-sys-surface-container-low); overflow: auto; }
    .map { flex: 1; display: grid; place-items: center; background: var(--mat-sys-surface-container); }
    .todo { color: var(--mat-sys-on-surface-variant); padding: 16px; }
    odo-icon { width: 20px; height: 20px; margin-right: 6px; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (max-width: 760px) { :host { flex-direction: column-reverse; } .panel { width: auto; height: 50%; border-right: 0; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage {
  protected readonly i18n = inject(I18nService);
}
