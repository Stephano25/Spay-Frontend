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
    console.log('🚀 SPaye Frontend démarré');
    console.log('📊 Environnement:', environment.production ? 'production' : 'development');
    console.log('🔗 API URL:', environment.apiUrl);
  })
  .catch((err) => {
    console.error('❌ Erreur de bootstrap:', err);
  });