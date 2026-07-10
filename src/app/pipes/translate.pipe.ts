// ============================================================
// TRANSLATE PIPE - SPaye (Standalone)
// ============================================================

import { Pipe, PipeTransform, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // ✅ Important pour la réactivité
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private langSubscription: Subscription;
  private lastKey: string = '';
  private lastTranslation: string = '';
  private currentLang: string = '';

  constructor() {
    // ✅ S'abonner aux changements de langue
    this.langSubscription = this.translationService.language$.subscribe((lang) => {
      this.currentLang = lang;
      // ✅ Forcer la mise à jour du cache
      this.lastKey = '';
    });
  }

  transform(key: string): string {
    if (!key) return '';
    
    // ✅ Recalculer si la clé change ou si la langue change
    if (this.lastKey !== key) {
      this.lastKey = key;
      this.lastTranslation = this.translationService.translate(key);
    }
    return this.lastTranslation;
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }
}