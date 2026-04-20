import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedPrimaryColor = localStorage.getItem('primaryColor') || '#667eea';
    const savedSecondaryColor = localStorage.getItem('secondaryColor') || '#764ba2';
    
    let actualTheme = savedTheme;
    if (savedTheme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.classList.add(`${actualTheme}-theme`);
    document.documentElement.style.setProperty('--primary-color', savedPrimaryColor);
    document.documentElement.style.setProperty('--secondary-color', savedSecondaryColor);
    
    // Écouter les changements de thème système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const theme = localStorage.getItem('theme');
      if (theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${newTheme}-theme`);
      }
    });
    
    // Vérifier la langue sauvegardée
    const savedLang = localStorage.getItem('language');
    if (savedLang && savedLang !== 'fr') {
      console.log(`🌐 Langue chargée: ${savedLang}`);
    }
  })
  .catch((err) => {
    console.error('❌ Erreur de bootstrap:', err);
  });