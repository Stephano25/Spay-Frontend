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
    // Le thème est géré par ThemeService après la connexion
    // Ne pas forcer de thème ici
    
    // Service Worker (notifications push)
    if ('serviceWorker' in navigator && !environment.production) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/assets/notification-sw.js')
          .then(reg => console.log('✅ Service Worker enregistré', reg))
          .catch(err => console.error('❌ Erreur SW', err));
      });
    }
  })
  .catch((err) => {
    console.error('❌ Erreur de bootstrap:', err);
  });