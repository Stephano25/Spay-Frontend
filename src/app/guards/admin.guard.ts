import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }
    
    if (this.authService.isAuthenticated()) {
      // Utilisateur connecté mais pas admin → redirection vers user
      console.log('Utilisateur non-admin, redirection vers /user');
      return this.router.parseUrl('/user');
    }
    
    // Non connecté → redirection vers login
    console.log('Non authentifié, redirection vers login');
    return this.router.parseUrl('/login');
  }
}