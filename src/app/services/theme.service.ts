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
    
    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'system') {
        this.applyTheme('system');
      }
    });
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
    
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    this.renderer.addClass(document.body, `${actualTheme}-theme`);
    
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    }
    
    localStorage.setItem('theme', theme);
    if (primaryColor) localStorage.setItem('primaryColor', primaryColor);
    if (secondaryColor) localStorage.setItem('secondaryColor', secondaryColor);
    
    this.currentThemeSubject.next(actualTheme);
    console.log(`✅ Thème appliqué: ${actualTheme}`);
  }

  applyFontSize(size: string): void {
    const body = document.body;
    body.classList.remove('font-small', 'font-medium', 'font-large');
    if (size === 'small') body.classList.add('font-small');
    else if (size === 'large') body.classList.add('font-large');
    else body.classList.add('font-medium');
    localStorage.setItem('font-size', size);
  }

  getCurrentTheme(): string {
    return localStorage.getItem('theme') || 'light';
  }
}