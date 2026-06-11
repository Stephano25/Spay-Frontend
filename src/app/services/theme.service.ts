// src/app/services/theme.service.ts
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<string>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();
  private currentUserId: string | null = null;

  constructor(
    rendererFactory: RendererFactory2,
    private authService: AuthService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.authService.currentUser.subscribe(user => {
      this.currentUserId = user?.id || null;
      console.log(`🔁 ThemeService: utilisateur changé, ID = ${this.currentUserId || 'guest'}`);
      this.loadThemeForCurrentUser();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const savedTheme = this.getStoredTheme();
      if (savedTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  loadTheme(): void {
    this.loadThemeForCurrentUser();
  }

  private getStorageKey(): string {
    return this.currentUserId ? `theme_${this.currentUserId}` : 'theme_guest';
  }

  private getStoredTheme(): string {
    const key = this.getStorageKey();
    const stored = localStorage.getItem(key);
    return stored || 'light';
  }

  private storeTheme(theme: string): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, theme);
    console.log(`💾 Thème sauvegardé: clé=${key}, valeur=${theme}`);
  }

  private storeColors(primary: string, secondary: string): void {
    if (this.currentUserId) {
      localStorage.setItem(`primaryColor_${this.currentUserId}`, primary);
      localStorage.setItem(`secondaryColor_${this.currentUserId}`, secondary);
    } else {
      localStorage.setItem('primaryColor_guest', primary);
      localStorage.setItem('secondaryColor_guest', secondary);
    }
  }

  private getStoredPrimaryColor(): string {
    const key = this.currentUserId ? `primaryColor_${this.currentUserId}` : 'primaryColor_guest';
    return localStorage.getItem(key) || '#667eea';
  }

  private getStoredSecondaryColor(): string {
    const key = this.currentUserId ? `secondaryColor_${this.currentUserId}` : 'secondaryColor_guest';
    return localStorage.getItem(key) || '#764ba2';
  }

  loadThemeForCurrentUser(): void {
    const savedTheme = this.getStoredTheme();
    const savedPrimaryColor = this.getStoredPrimaryColor();
    const savedSecondaryColor = this.getStoredSecondaryColor();
    console.log(`🎨 Chargement thème pour ${this.currentUserId || 'guest'} : ${savedTheme}`);
    this.applyTheme(savedTheme, savedPrimaryColor, savedSecondaryColor);
  }

  applyTheme(theme: string, primaryColor?: string, secondaryColor?: string): void {
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    this.renderer.addClass(document.body, `${actualTheme}-theme`);
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    }
    this.storeTheme(theme);
    if (primaryColor || secondaryColor) {
      this.storeColors(primaryColor || '#667eea', secondaryColor || '#764ba2');
    }
    this.currentThemeSubject.next(actualTheme);
    console.log(`✅ Thème appliqué: ${actualTheme} pour ${this.currentUserId || 'guest'}`);
  }

  applyFontSize(size: string): void {
    const body = document.body;
    body.classList.remove('font-small', 'font-medium', 'font-large');
    if (size === 'small') body.classList.add('font-small');
    else if (size === 'large') body.classList.add('font-large');
    else body.classList.add('font-medium');
    const key = this.currentUserId ? `font-size_${this.currentUserId}` : 'font-size_guest';
    localStorage.setItem(key, size);
  }

  getCurrentTheme(): string {
    return this.getStoredTheme();
  }

  // 👇 AJOUT DE CES DEUX MÉTHODES
  getCurrentPrimaryColor(): string {
    return this.getStoredPrimaryColor();
  }

  getCurrentSecondaryColor(): string {
    return this.getStoredSecondaryColor();
  }
}