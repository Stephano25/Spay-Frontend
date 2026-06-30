// ============================================================
// ADMIN GUARD - SPaye
// ============================================================

import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    console.log('🛡️ AdminGuard - Vérification des droits admin');
    
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Non authentifié');
      return this.router.parseUrl('/login');
    }

    const user = this.authService.getCurrentUser();
    console.log('👤 Utilisateur:', user?.email, 'Rôle:', user?.role);
    
    // Vérifier si l'utilisateur est admin
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      console.log('✅ Accès admin autorisé');
      return true;
    }

    console.log('❌ Accès admin refusé, redirection vers user dashboard');
    return this.router.parseUrl('/user/dashboard');
  }
}