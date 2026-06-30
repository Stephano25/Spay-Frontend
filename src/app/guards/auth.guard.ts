// ============================================================
// AUTH GUARD - SPaye
// ============================================================

import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    console.log('🔒 AuthGuard - Vérification de l\'authentification');
    
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      console.log('👤 Utilisateur connecté:', user?.email, 'Rôle:', user?.role);
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        console.log('🔀 Redirection vers admin dashboard');
        return this.router.parseUrl('/admin/dashboard');
      }
      
      console.log('✅ Accès autorisé');
      return true;
    }
    
    console.log('❌ Non authentifié, redirection vers login');
    return this.router.parseUrl('/login');
  }
}