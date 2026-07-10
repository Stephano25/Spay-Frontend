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
      
      // ✅ Charger les préférences après la connexion
      setTimeout(() => {
        this.loadThemeForCurrentUser();
        this.loadFontSizeForCurrentUser();
      }, 100);
    });
    
    // ✅ Écouter les changements de thème système
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

  // ✅ Méthode publique pour appliquer la taille de police
  loadFontSize(): void {
    this.loadFontSizeForCurrentUser();
  }

  private getStorageKey(): string {
    return this.currentUserId ? `theme_${this.currentUserId}` : 'theme_guest';
  }

  private getFontSizeKey(): string {
    return this.currentUserId ? `font-size_${this.currentUserId}` : 'font-size_guest';
  }

  private getStoredTheme(): string {
    const key = this.getStorageKey();
    const stored = localStorage.getItem(key);
    return stored || 'light';
  }

  private getStoredFontSize(): string {
    const key = this.getFontSizeKey();
    const stored = localStorage.getItem(key);
    return stored || 'medium';
  }

  private storeTheme(theme: string): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, theme);
    console.log(`💾 Thème sauvegardé: clé=${key}, valeur=${theme}`);
  }

  private storeFontSize(size: string): void {
    const key = this.getFontSizeKey();
    localStorage.setItem(key, size);
    console.log(`💾 Taille police sauvegardée: clé=${key}, valeur=${size}`);
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

  loadFontSizeForCurrentUser(): void {
    const savedSize = this.getStoredFontSize();
    console.log(`📏 Chargement taille police pour ${this.currentUserId || 'guest'} : ${savedSize}`);
    this.applyFontSize(savedSize);
  }

  applyTheme(theme: string, primaryColor?: string, secondaryColor?: string): void {
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // ✅ Supprimer les anciennes classes
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    
    // ✅ Ajouter la nouvelle classe
    this.renderer.addClass(document.body, `${actualTheme}-theme`);
    
    // ✅ Application des variables CSS globales
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--brand-1', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
      document.documentElement.style.setProperty('--brand-2', secondaryColor);
    }
    
    this.storeTheme(theme);
    if (primaryColor || secondaryColor) {
      this.storeColors(primaryColor || '#667eea', secondaryColor || '#764ba2');
    }
    this.currentThemeSubject.next(actualTheme);
    console.log(`✅ Thème appliqué: ${actualTheme} pour ${this.currentUserId || 'guest'}`);
  }

  applyFontSize(size: string): void {
    // ✅ Supprimer toutes les classes de taille
    this.renderer.removeClass(document.body, 'font-small');
    this.renderer.removeClass(document.body, 'font-medium');
    this.renderer.removeClass(document.body, 'font-large');
    
    // ✅ Ajouter la classe correspondante
    if (size === 'small') {
      this.renderer.addClass(document.body, 'font-small');
      document.documentElement.style.fontSize = '14px';
    } else if (size === 'large') {
      this.renderer.addClass(document.body, 'font-large');
      document.documentElement.style.fontSize = '18px';
    } else {
      this.renderer.addClass(document.body, 'font-medium');
      document.documentElement.style.fontSize = '16px';
    }
    
    // ✅ Sauvegarde
    this.storeFontSize(size);
    console.log(`✅ Taille police appliquée: ${size} pour ${this.currentUserId || 'guest'}`);
  }

  getCurrentTheme(): string {
    return this.getStoredTheme();
  }

  getCurrentFontSize(): string {
    return this.getStoredFontSize();
  }

  getCurrentPrimaryColor(): string {
    return this.getStoredPrimaryColor();
  }

  getCurrentSecondaryColor(): string {
    return this.getStoredSecondaryColor();
  }
}