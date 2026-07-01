// frontend/src/app/guards/admin.guard.ts
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
    console.log('🛡️ AdminGuard - Vérification');
    
    // ✅ Récupérer l'utilisateur
    const user = this.authService.getCurrentUser();
    
    // ✅ Si pas d'utilisateur ou pas authentifié, rediriger vers login
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return this.router.parseUrl('/login');
    }
    
    // ✅ Vérifier le rôle
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    console.log('👤 Utilisateur:', user.email, 'Rôle:', user.role, 'Est Admin:', isAdmin);
    
    if (isAdmin) {
      console.log('✅ Accès admin autorisé');
      return true;
    }
    
    console.log('❌ Accès admin refusé');
    return this.router.parseUrl('/user/dashboard');
  }
}