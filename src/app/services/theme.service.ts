import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<string>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadTheme();
  }

  loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedPrimaryColor = localStorage.getItem('primaryColor') || '#667eea';
    const savedSecondaryColor = localStorage.getItem('secondaryColor') || '#764ba2';
    this.applyTheme(savedTheme, savedPrimaryColor, savedSecondaryColor);
  }

  applyTheme(theme: string, primaryColor?: string, secondaryColor?: string): void {
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Supprimer les anciennes classes
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    
    // Ajouter la nouvelle classe
    this.renderer.addClass(document.body, `${actualTheme}-theme`);
    
    // Appliquer les couleurs personnalisées
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    }
    
    // Sauvegarder
    localStorage.setItem('theme', theme);
    if (primaryColor) localStorage.setItem('primaryColor', primaryColor);
    if (secondaryColor) localStorage.setItem('secondaryColor', secondaryColor);
    
    this.currentThemeSubject.next(actualTheme);
    console.log(`✅ Thème appliqué: ${actualTheme}`);
  }

  getCurrentTheme(): string {
    return localStorage.getItem('theme') || 'light';
  }
}