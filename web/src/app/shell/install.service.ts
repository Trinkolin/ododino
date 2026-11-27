import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Installation de l'app sur l'écran d'accueil.
 * - Android / ordinateur (Chrome, Edge…) : le navigateur annonce que l'installation est possible
 *   (beforeinstallprompt) ; le bouton « Installer l'app » la déclenche.
 * - iPhone / iPad (Safari) : pas d'annonce ; on explique le geste (Partager → Sur l'écran d'accueil).
 * - Déjà installée (lancée depuis l'écran d'accueil) : pas de bouton.
 */
@Injectable({ providedIn: 'root' })
export class InstallService {
  private deferred: BeforeInstallPromptEvent | null = null;
  readonly canPrompt = signal(false);
  readonly isIos = signal(false);
  readonly installed = signal(false);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const standalone = (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    this.installed.set(standalone);
    this.isIos.set(!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent));
    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.canPrompt.set(true);
    });
    addEventListener('appinstalled', () => { this.installed.set(true); this.canPrompt.set(false); });
  }

  async prompt(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.canPrompt.set(false);
  }
}
