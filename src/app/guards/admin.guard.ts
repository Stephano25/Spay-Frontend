// frontend/src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    console.log('🛡️ AdminGuard - Vérification');
    console.log('👤 Utilisateur:', user?.email, 'Rôle:', user?.role);

    if (!user) {
      this.notificationService.showError('Veuillez vous connecter');
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier si l'utilisateur est admin ou super_admin
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    
    if (!isAdmin) {
      this.notificationService.showError('Accès réservé aux administrateurs');
      this.router.navigate(['/user/dashboard']);
      return false;
    }

    // Vérifier les routes spécifiques pour super_admin
    const adminRoutes = ['admins', 'admins/create'];
    const currentRoute = route.routeConfig?.path || '';
    
    if (adminRoutes.some(r => currentRoute.includes(r))) {
      if (user.role !== 'super_admin') {
        this.notificationService.showError('Accès réservé aux Super Administrateurs');
        this.router.navigate(['/admin/dashboard']);
        return false;
      }
    }

    console.log('✅ Accès admin autorisé');
    return true;
  }
}