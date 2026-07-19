// angular/src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ✅ Ne pas intercepter les requêtes vers l'API de Google
    if (req.url.includes('googleapis.com') || req.url.includes('google.com')) {
      return next.handle(req);
    }

    // ✅ Ne pas intercepter les requêtes de santé
    if (req.url.includes('/health')) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    let authReq = req;
    if (token) {
      const cleanToken = token.trim();
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${cleanToken}`),
        withCredentials: true,
      });
      console.log('🔑 Token ajouté à la requête:', req.url);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.warn(`⚠️ Endpoint non trouvé (404): ${req.url}`);
          return throwError(() => error);
        }

        console.error('❌ Erreur HTTP:', error.status, req.url);

        if (error.status === 403) {
          console.warn('⚠️ Accès interdit (403) - Vérifiez vos permissions');
        }

        if (error.status === 401) {
          console.warn('⚠️ Token expiré ou invalide, déconnexion...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      }),
    );
  }
}