import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FICHES, Fiche } from '../cards/fiche';
import LABELS from '../cards/generated/labels.json';
import { I18nService } from '../i18n/i18n.service';
import { LANGS } from '../i18n/i18n.service';
import { hm } from '../map/config';
import { Icon } from '../shell/icon';
import { PackImg } from '../offline/pack-img';
import { SeoService } from '../shell/seo.service';

type Labels = (typeof LABELS)['it'];

/**
 * Fiche phare /<langue>/<fiche>/ : pré-rendue au build (texte, photo, sources), avec les balises pour les
 * moteurs de recherche. Le contenu arrive par ficheResolver (cards/fiche.ts).
 */
@Component({
  selector: 'odo-card-page',
  imports: [RouterLink, MatButtonModule, Icon, PackImg],
  templateUrl: './card-page.html',
  styleUrl: './card-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPage {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly seo = inject(SeoService);

  /** fourni par ficheResolver ; null si la fiche n'existe pas */
  readonly fiche = input<Fiche | null>(null);

  protected readonly L = computed<Labels>(() => (LABELS as Record<string, Labels>)[this.i18n.lang()] ?? LABELS.it);
  protected readonly text = computed(() => { const f = this.fiche(); return f ? f.texts[this.i18n.lang()] ?? f.texts['it'] : null; });
  /** « Voir sur la carte » : le lieu ou le sentier sélectionné, ou la carte entière (fiche d'introduction) */
  protected readonly mapFragment = computed(() => {
    const f = this.fiche();
    return !f?.osm ? undefined : f.kind === 'trail' ? `trail=${f.osm}` : `poi=${f.osm}`;
  });
  protected readonly intro = computed(() => (FICHES.intro && FICHES.intro !== this.fiche()?.slug ? FICHES.intro : null));
  protected readonly hm = hm;

  constructor() {
    effect(() => {
      const f = this.fiche(), t = this.text(), lang = this.i18n.lang();
      if (!f || !t) { this.seo.clear(); return; }
      const url = (l: string) => `${FICHES.siteUrl}/${l}/${f.slug}/`;
      this.seo.set({
        title: t.title, description: t.description, canonical: url(lang),
        alternates: Object.fromEntries(LANGS.map((l) => [l, url(l)])),
        image: f.photo ? `${FICHES.siteUrl}/${f.photo.src}` : undefined,
        noindex: f.draft,
      });
      this.host.nativeElement.scrollTop = 0; // nouvelle fiche : en haut de la page
    });
    inject(DestroyRef).onDestroy(() => this.seo.clear());
  }

  protected date(iso: string | null): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this.i18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Liens du texte vers une autre fiche (« it/matajur/ ») : navigation dans l'app, sans recharger la page. */
  protected bodyClick(ev: MouseEvent): void {
    const a = (ev.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (!href || /^[a-z]+:/i.test(href) || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button !== 0) return;
    ev.preventDefault();
    this.router.navigateByUrl('/' + href.replace(/\/$/, ''));
  }
}
