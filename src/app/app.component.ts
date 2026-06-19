import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { TranslationService } from './services/translation.service';
import { ChatService } from './services/chat.service'; // ← import pour injection

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private translationService: TranslationService,
    private chatService: ChatService // ← injection qui déclenche l'abonnement
  ) {}

  ngOnInit(): void {
    this.themeService.loadTheme();
    const savedLang = localStorage.getItem('user_language') || 'fr';
    this.translationService.setLanguage(savedLang);
    const savedFontSize = localStorage.getItem('font-size') || 'medium';
    document.body.classList.add(`font-${savedFontSize}`);
  }
}