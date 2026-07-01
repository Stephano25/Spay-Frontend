// src/app/interceptors/auth.interceptor.ts
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
    private router: Router
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
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // ✅ Token expiré ou invalide -> déconnexion
          console.warn('⚠️ Token expiré ou invalide, déconnexion...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}