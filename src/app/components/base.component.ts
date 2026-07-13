// frontend/src/app/components/base.component.ts
import { Component, OnDestroy, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';
import { ThemeService } from '../services/theme.service';

@Component({
  template: ''
})
export class BaseComponent implements OnInit, OnDestroy {
  protected translationService = inject(TranslationService);
  protected themeService = inject(ThemeService);
  protected cdr = inject(ChangeDetectorRef);
  protected subscriptions: Subscription[] = [];
  
  private langSubscription: Subscription;
  private fontSizeSubscription: Subscription;
  private langChangeListener: ((event: CustomEvent) => void) | null = null;

  constructor() {
    // ✅ S'abonner aux changements de langue
    this.langSubscription = this.translationService.language$.subscribe((lang) => {
      console.log(`🌐 ${this.constructor.name}: Langue changée en ${lang}`);
      this.cdr.markForCheck();
      this.cdr.detectChanges(); // ✅ FORCER la détection
    });

    this.fontSizeSubscription = this.themeService.currentFontSize$.subscribe((size) => {
      console.log(`📏 ${this.constructor.name}: Taille de police changée en ${size}`);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    // ✅ Écouter l'événement personnalisé
    this.langChangeListener = (event: CustomEvent) => {
      console.log(`🌐 ${this.constructor.name}: Événement languageChanged reçu -> ${event.detail?.lang}`);
      this.cdr.markForCheck();
      this.cdr.detectChanges(); // ✅ FORCER la détection
    };
    document.addEventListener('languageChanged', this.langChangeListener as EventListener);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.fontSizeSubscription) {
      this.fontSizeSubscription.unsubscribe();
    }
    if (this.langChangeListener) {
      document.removeEventListener('languageChanged', this.langChangeListener as EventListener);
    }
  }
}