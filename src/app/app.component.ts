// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.themeService.loadTheme();  // charge le thème de l'utilisateur connecté (ou guest)
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.translationService.setLanguage(savedLang);
    const savedFontSize = localStorage.getItem('font-size') || 'medium';
    document.body.classList.add(`font-${savedFontSize}`);
  }
}