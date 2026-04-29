import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private langSubscription: Subscription;
  private lastKey: string = '';
  private lastTranslation: string = '';

  constructor(private translationService: TranslationService) {
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