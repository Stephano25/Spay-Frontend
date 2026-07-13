// frontend/src/app/services/theme.service.ts
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
  
  private currentFontSizeSubject = new BehaviorSubject<string>('medium');
  public currentFontSize$ = this.currentFontSizeSubject.asObservable();
  
  private currentLanguageSubject = new BehaviorSubject<string>('fr');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  
  private currentUserId: string | null = null;

  constructor(
    rendererFactory: RendererFactory2,
    private authService: AuthService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    
    this.authService.currentUser.subscribe(user => {
      this.currentUserId = user?.id || null;
      setTimeout(() => {
        this.loadThemeForCurrentUser();
        this.loadFontSizeForCurrentUser();
        this.loadLanguageForCurrentUser();
      }, 100);
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

  loadFontSize(): void {
    this.loadFontSizeForCurrentUser();
  }

  loadLanguage(): void {
    this.loadLanguageForCurrentUser();
  }

  syncAll(): void {
    console.log('🔄 ThemeService: Synchronisation de tous les paramètres');
    this.loadThemeForCurrentUser();
    this.loadFontSizeForCurrentUser();
    this.loadLanguageForCurrentUser();
  }

  private getStorageKey(): string {
    return this.currentUserId ? `theme_${this.currentUserId}` : 'theme_guest';
  }

  private getFontSizeKey(): string {
    return this.currentUserId ? `font-size_${this.currentUserId}` : 'font-size_guest';
  }

  private getLanguageKey(): string {
    return this.currentUserId ? `language_${this.currentUserId}` : 'language_guest';
  }

  // ============================================================
  // THÈME
  // ============================================================

  private getStoredTheme(): string {
    const key = this.getStorageKey();
    return localStorage.getItem(key) || 'light';
  }

  private storeTheme(theme: string): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, theme);
  }

  loadThemeForCurrentUser(): void {
    const savedTheme = this.getStoredTheme();
    const savedPrimaryColor = this.getStoredPrimaryColor();
    const savedSecondaryColor = this.getStoredSecondaryColor();
    this.applyTheme(savedTheme, savedPrimaryColor, savedSecondaryColor);
  }

  applyTheme(theme: string, primaryColor?: string, secondaryColor?: string): void {
    console.log(`🎨 ThemeService: Application du thème ${theme}`);
    
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    this.renderer.addClass(document.body, `${actualTheme}-theme`);
    
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
      this.storeColors(primaryColor || '#7c3aed', secondaryColor || '#4f46e5');
    }
    this.currentThemeSubject.next(actualTheme);
  }

  private getStoredPrimaryColor(): string {
    const key = this.currentUserId ? `primaryColor_${this.currentUserId}` : 'primaryColor_guest';
    return localStorage.getItem(key) || '#7c3aed';
  }

  private getStoredSecondaryColor(): string {
    const key = this.currentUserId ? `secondaryColor_${this.currentUserId}` : 'secondaryColor_guest';
    return localStorage.getItem(key) || '#4f46e5';
  }

  private storeColors(primary: string, secondary: string): void {
    const primaryKey = this.currentUserId ? `primaryColor_${this.currentUserId}` : 'primaryColor_guest';
    const secondaryKey = this.currentUserId ? `secondaryColor_${this.currentUserId}` : 'secondaryColor_guest';
    localStorage.setItem(primaryKey, primary);
    localStorage.setItem(secondaryKey, secondary);
  }

  getCurrentTheme(): string {
    return this.getStoredTheme();
  }

  getCurrentPrimaryColor(): string {
    return this.getStoredPrimaryColor();
  }

  getCurrentSecondaryColor(): string {
    return this.getStoredSecondaryColor();
  }

  // ============================================================
  // TAILLE DE POLICE - ✅ APPLICATION GLOBALE
  // ============================================================

  private getStoredFontSize(): string {
    const key = this.getFontSizeKey();
    return localStorage.getItem(key) || 'medium';
  }

  private storeFontSize(size: string): void {
    const key = this.getFontSizeKey();
    localStorage.setItem(key, size);
  }

  loadFontSizeForCurrentUser(): void {
    const savedSize = this.getStoredFontSize();
    this.applyFontSize(savedSize);
  }

  /**
   * ✅ Applique la taille de police sur TOUT le document
   */
  applyFontSize(size: string): void {
    console.log(`📏 ThemeService: Application de la taille de police ${size}`);
    
    this.renderer.removeClass(document.body, 'font-small');
    this.renderer.removeClass(document.body, 'font-medium');
    this.renderer.removeClass(document.body, 'font-large');
    
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
    
    this.storeFontSize(size);
    this.currentFontSizeSubject.next(size);
  }

  getCurrentFontSize(): string {
    return this.getStoredFontSize();
  }

  // ============================================================
  // LANGUE - ✅ APPLICATION GLOBALE
  // ============================================================

  private getStoredLanguage(): string {
    const key = this.getLanguageKey();
    return localStorage.getItem(key) || 'fr';
  }

  private storeLanguage(lang: string): void {
    const key = this.getLanguageKey();
    localStorage.setItem(key, lang);
    localStorage.setItem('user_language', lang);
  }

  loadLanguageForCurrentUser(): void {
    const savedLang = this.getStoredLanguage();
    this.applyLanguage(savedLang);
  }

  /**
   * ✅ Applique la langue sur TOUT le document
   */
  applyLanguage(lang: string): void {
    console.log(`🌐 ThemeService: Application de la langue ${lang} sur TOUTES les pages`);
    
    document.documentElement.lang = lang;
    
    if (lang === 'ar' || lang === 'he') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    this.storeLanguage(lang);
    this.currentLanguageSubject.next(lang);
    
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }, 10);
  }

  getCurrentLanguage(): string {
    return this.getStoredLanguage();
  }

  /**
   * ✅ Met à jour tous les paramètres d'apparence en une seule fois
   */
  updateAppearance(theme: string, fontSize: string, language: string): void {
    console.log(`🔄 ThemeService: Mise à jour unifiée - Thème:${theme}, Police:${fontSize}, Langue:${language}`);
    this.applyTheme(theme);
    this.applyFontSize(fontSize);
    this.applyLanguage(language);
  }
}