// ============================================================
// APP CONFIG - SPaye
// ============================================================

import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { IpService } from './services/ip.service';
import { environment, setLocalIp } from '../environments/environment';

// ✅ Fonction d'initialisation - détection automatique de l'IP
export function initializeApp(ipService: IpService): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      // Vérifier si une IP est déjà stockée
      const savedIp = localStorage.getItem('local_ip');
      if (savedIp) {
        console.log(`✅ IP déjà configurée: ${savedIp}`);
        // Mettre à jour l'environnement
        const baseUrl = `http://${savedIp}:3000`;
        (environment as any).apiUrl = `${baseUrl}/api`;
        (environment as any).socketUrl = baseUrl;
        (environment as any).baseUrl = baseUrl;
        resolve();
        return;
      }

      // Détecter automatiquement le backend
      console.log('🔍 Détection automatique du backend...');
      ipService.autoDetectBackend().subscribe({
        next: (ip) => {
          console.log(`✅ Backend trouvé: ${ip}`);
          setLocalIp(ip);
          const baseUrl = `http://${ip}:3000`;
          (environment as any).apiUrl = `${baseUrl}/api`;
          (environment as any).socketUrl = baseUrl;
          (environment as any).baseUrl = baseUrl;
          resolve();
        },
        error: (error) => {
          console.warn('⚠️ Erreur de détection, utilisation de localhost');
          const defaultIp = 'localhost';
          setLocalIp(defaultIp);
          const baseUrl = `http://${defaultIp}:3000`;
          (environment as any).apiUrl = `${baseUrl}/api`;
          (environment as any).socketUrl = baseUrl;
          (environment as any).baseUrl = baseUrl;
          resolve();
        }
      });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    IpService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [IpService],
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};