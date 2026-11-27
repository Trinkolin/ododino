import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { I18nService } from './i18n/i18n.service';

describe('App (cadre)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }).compileComponents();
  });

  it('affiche le nom et le sous-titre dans la langue courante', async () => {
    TestBed.inject(I18nService).use('fr');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent).toContain('Ododino');
    expect(el.querySelector('.sub')?.textContent).toContain('Vallées du Natisone');
  });

  it('traduit avec repli sur l’italien puis sur la clé', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.use('sl');
    expect(i18n.t('tabTrails')).toBe('Poti');
    expect(i18n.t('clé.inconnue')).toBe('clé.inconnue');
  });
});
