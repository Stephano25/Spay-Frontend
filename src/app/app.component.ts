// frontend/src/app/app.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private themeService: ThemeService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ✅ 1. Charger la langue sauvegardée
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.translationService.setLanguage(savedLang);
    this.themeService.applyLanguage(savedLang);

    // ✅ 2. S'abonner aux changements de langue - SANS appRef.tick()
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 AppComponent: Langue changée en ${lang}`);
        document.documentElement.lang = lang;
        this.cdr.detectChanges();
      })
    );

    // ✅ 3. Écouter l'événement personnalisé
    document.addEventListener('languageChanged', this.handleLanguageChange.bind(this));

    // ✅ 4. Appliquer le thème et la taille de police
    this.themeService.syncAll();
    const savedFontSize = this.themeService.getCurrentFontSize();
    this.themeService.applyFontSize(savedFontSize);
  }

  private handleLanguageChange(event: any): void {
    console.log('🌐 AppComponent: Événement languageChanged reçu', event.detail);
    this.cdr.detectChanges(); // ✅ Pas de appRef.tick()
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    document.removeEventListener('languageChanged', this.handleLanguageChange.bind(this));
  }
}