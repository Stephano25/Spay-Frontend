// frontend/src/app/components/base.component.ts
import { Component, OnDestroy, ChangeDetectorRef, inject, OnInit, NgZone } from '@angular/core';
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
  protected ngZone = inject(NgZone);
  protected subscriptions: Subscription[] = [];
  
  private langSubscription: Subscription | null = null;
  private fontSizeSubscription: Subscription | null = null;
  private langChangeListener: ((event: CustomEvent) => void) | null = null;
  private isDestroyed = false;

  constructor() {
    // S'abonner aux changements de langue
    this.langSubscription = this.translationService.language$.subscribe((lang) => {
      console.log(`🌐 BaseComponent: Langue changée en ${lang}`);
      if (!this.isDestroyed) {
        // ⭐ CORRECTION: Utiliser ngZone.run pour éviter les erreurs d'assertion
        this.ngZone.run(() => {
          this.cdr.markForCheck();
          // ⭐ CORRECTION: Ne pas appeler detectChanges ici
        });
      }
    });

    this.fontSizeSubscription = this.themeService.currentFontSize$.subscribe((size) => {
      console.log(`📏 BaseComponent: Taille de police changée en ${size}`);
      if (!this.isDestroyed) {
        this.ngZone.run(() => {
          this.cdr.markForCheck();
          // ⭐ CORRECTION: Ne pas appeler detectChanges ici
        });
      }
    });
  }

  ngOnInit(): void {
    this.langChangeListener = (event: CustomEvent) => {
      console.log(`🌐 BaseComponent: Événement languageChanged reçu -> ${event.detail?.lang}`);
      if (!this.isDestroyed) {
        this.ngZone.run(() => {
          this.cdr.markForCheck();
        });
      }
    };
    document.addEventListener('languageChanged', this.langChangeListener as EventListener);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    
    this.subscriptions.forEach(sub => {
      try {
        if (sub && !sub.closed) {
          sub.unsubscribe();
        }
      } catch (e) {
        // Ignorer
      }
    });
    this.subscriptions = [];
    
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
      this.langSubscription = null;
    }
    if (this.fontSizeSubscription) {
      this.fontSizeSubscription.unsubscribe();
      this.fontSizeSubscription = null;
    }
    if (this.langChangeListener) {
      document.removeEventListener('languageChanged', this.langChangeListener as EventListener);
      this.langChangeListener = null;
    }
  }

  // ⭐ CORRECTION: Méthode sécurisée pour forcer la détection des changements
  protected safeDetectChanges(): void {
    if (!this.isDestroyed) {
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    }
  }

  // ⭐ CORRECTION: Méthode sécurisée pour marquer pour vérification
  protected safeMarkForCheck(): void {
    if (!this.isDestroyed) {
      this.ngZone.run(() => {
        this.cdr.markForCheck();
      });
    }
  }
}