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
    // S'abonner aux changements d'utilisateur pour charger son thème
    this.authService.currentUser.subscribe(user => {
      this.currentUserId = user?.id || null;
      this.loadThemeForCurrentUser();
    });
    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const savedTheme = this.getStoredTheme();
      if (savedTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  /**
   * Méthode publique pour charger le thème (compatibilité)
   */
  loadTheme(): void {
    this.loadThemeForCurrentUser();
  }

  /**
   * Clé de stockage pour le thème de l'utilisateur courant
   */
  private getStorageKey(): string {
    return this.currentUserId ? `theme_${this.currentUserId}` : 'theme_guest';
  }

  /**
   * Récupère le thème stocké pour l'utilisateur courant
   */
  private getStoredTheme(): string {
    const key = this.getStorageKey();
    return localStorage.getItem(key) || 'light';
  }

  /**
   * Sauvegarde le thème pour l'utilisateur courant
   */
  private storeTheme(theme: string): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, theme);
  }

  /**
   * Sauvegarde les couleurs personnalisées (liées à l'utilisateur)
   */
  private storeColors(primary: string, secondary: string): void {
    if (this.currentUserId) {
      localStorage.setItem(`primaryColor_${this.currentUserId}`, primary);
      localStorage.setItem(`secondaryColor_${this.currentUserId}`, secondary);
    } else {
      localStorage.setItem('primaryColor_guest', primary);
      localStorage.setItem('secondaryColor_guest', secondary);
    }
  }

  /**
   * Récupère la couleur primaire stockée
   */
  private getStoredPrimaryColor(): string {
    const key = this.currentUserId ? `primaryColor_${this.currentUserId}` : 'primaryColor_guest';
    return localStorage.getItem(key) || '#667eea';
  }

  /**
   * Récupère la couleur secondaire stockée
   */
  private getStoredSecondaryColor(): string {
    const key = this.currentUserId ? `secondaryColor_${this.currentUserId}` : 'secondaryColor_guest';
    return localStorage.getItem(key) || '#764ba2';
  }

  /**
   * Charge le thème de l'utilisateur courant (appelé après login ou au démarrage)
   */
  loadThemeForCurrentUser(): void {
    const savedTheme = this.getStoredTheme();
    const savedPrimaryColor = this.getStoredPrimaryColor();
    const savedSecondaryColor = this.getStoredSecondaryColor();
    this.applyTheme(savedTheme, savedPrimaryColor, savedSecondaryColor);
  }

  /**
   * Applique le thème (clair, sombre, système) et les couleurs
   */
  applyTheme(theme: string, primaryColor?: string, secondaryColor?: string): void {
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Retirer les anciennes classes et ajouter la nouvelle
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    this.renderer.addClass(document.body, `${actualTheme}-theme`);

    // Appliquer les couleurs personnalisées
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    }

    // Sauvegarder les préférences
    this.storeTheme(theme);
    if (primaryColor || secondaryColor) {
      this.storeColors(primaryColor || '#667eea', secondaryColor || '#764ba2');
    }

    this.currentThemeSubject.next(actualTheme);
    console.log(`✅ Thème appliqué: ${actualTheme} pour l'utilisateur ${this.currentUserId || 'guest'}`);
  }

  /**
   * Applique la taille de police (indépendante par utilisateur)
   */
  applyFontSize(size: string): void {
    const body = document.body;
    body.classList.remove('font-small', 'font-medium', 'font-large');
    if (size === 'small') body.classList.add('font-small');
    else if (size === 'large') body.classList.add('font-large');
    else body.classList.add('font-medium');
    const key = this.currentUserId ? `font-size_${this.currentUserId}` : 'font-size_guest';
    localStorage.setItem(key, size);
  }

  /**
   * Retourne le thème actuel stocké (sans appliquer)
   */
  getCurrentTheme(): string {
    return this.getStoredTheme();
  }
}