// frontend/src/app/pipes/translate.pipe.ts
import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService: TranslationService;
  private cdr: ChangeDetectorRef;
  private langSubscription: Subscription | null = null;
  private lastKey: string = '';
  private lastTranslation: string = '';
  private currentLang: string = '';

  constructor() {
    this.translationService = inject(TranslationService);
    this.cdr = inject(ChangeDetectorRef);
    
    this.langSubscription = this.translationService.language$.subscribe((lang) => {
      console.log(`🔄 TranslatePipe: Langue changée vers ${lang}`);
      this.currentLang = lang;
      this.lastKey = ''; // Force le recalcul
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    if (!key) return '';
    
    const currentLang = this.translationService.getCurrentLanguage();
    
    if (this.lastKey !== key || this.currentLang !== currentLang) {
      this.lastKey = key;
      this.currentLang = currentLang;
      this.lastTranslation = this.translationService.translate(key);
    }
    return this.lastTranslation;
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
      this.langSubscription = null;
    }
  }
}