// frontend/src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    console.log('🔒 AuthGuard - Vérification');
    
    const user = this.authService.getCurrentUser();
    
    if (user) {
      console.log('👤 Utilisateur connecté:', user.email);
      
      // ✅ Si l'utilisateur est admin, rediriger vers admin
      if (user.role === 'admin' || user.role === 'super_admin') {
        console.log('🔀 Admin détecté, redirection vers /admin/dashboard');
        return this.router.parseUrl('/admin/dashboard');
      }
      
      return true;
    }
    
    console.log('❌ Non authentifié, redirection vers login');
    return this.router.parseUrl('/login');
  }
}