import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { packFetch } from './pack';

/**
 * <img odoPackImg> : si l'image ne charge pas (pas de réseau), elle est lue dans le pack hors ligne.
 * Une balise <img> ordinaire passe par le service worker d'Angular, qui ne connaît pas le pack.
 */
@Directive({ selector: 'img[odoPackImg]', host: { '(error)': 'fallback()' } })
export class PackImg {
  private readonly img = inject(ElementRef<HTMLImageElement>).nativeElement as HTMLImageElement;
  private blobUrl = '';
  private tried = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => { if (this.blobUrl) URL.revokeObjectURL(this.blobUrl); });
  }

  protected async fallback(): Promise<void> {
    const src = this.img.getAttribute('src');
    if (!src || src.startsWith('blob:') || src === this.tried) return;
    this.tried = src;
    const res = await packFetch(src).catch(() => null);
    if (!res?.ok) return;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = URL.createObjectURL(await res.blob());
    this.img.src = this.blobUrl;
  }
}
