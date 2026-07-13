// frontend/src/app/pipes/translate.pipe.ts
import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // ✅ ESSENTIEL pour la réactivité
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private langSubscription: Subscription;
  private lastKey: string = '';
  private lastTranslation: string = '';
  private currentLang: string = '';

  constructor() {
    this.langSubscription = this.translationService.language$.subscribe((lang) => {
      console.log(`🔄 TranslatePipe: Langue changée vers ${lang}`);
      this.currentLang = lang;
      this.lastKey = ''; // ✅ Force le recalcul
      this.cdr.markForCheck(); // ✅ Pas de appRef.tick()
    });
  }

  transform(key: string): string {
    if (!key) return '';
    
    const currentLang = this.translationService.getCurrentLanguage();
    
    // ✅ Recalculer si la clé ou la langue a changé
    if (this.lastKey !== key || this.currentLang !== currentLang) {
      this.lastKey = key;
      this.currentLang = currentLang;
      this.lastTranslation = this.translationService.translate(key);
      this.cdr.markForCheck();
    }
    return this.lastTranslation;
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }
}