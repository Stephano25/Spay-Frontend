// ============================================================
// TRANSLATE PIPE - SPaye (Standalone)
// ============================================================

import { Pipe, PipeTransform, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true, // ✅ Standalone: true
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private langSubscription: Subscription;
  private lastKey: string = '';
  private lastTranslation: string = '';

  constructor() {
    this.langSubscription = this.translationService.language$.subscribe(() => {
      this.lastKey = '';
    });
  }

  transform(key: string): string {
    if (this.lastKey !== key) {
      this.lastKey = key;
      this.lastTranslation = this.translationService.translate(key);
    }
    return this.lastTranslation;
  }

  ngOnDestroy(): void {
    this.langSubscription.unsubscribe();
  }
}