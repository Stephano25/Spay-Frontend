// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Routes publiques
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) 
  },
  
  // Callback OAuth
  { 
    path: 'auth/callback', 
    loadComponent: () => import('./components/auth/callback').then(m => m.AuthCallbackComponent) 
  },
  
  // ✅ Routes utilisateur (protégées par AuthGuard)
  {
    path: 'user',
    canActivate: [AuthGuard],
    loadChildren: () => import('./components/user/user.routes').then(m => m.USER_ROUTES)
  },
  
  // ✅ Routes admin (protégées par AdminGuard SEULEMENT)
  {
    path: 'admin',
    canActivate: [AdminGuard],  // ✅ SEULEMENT AdminGuard, PAS AuthGuard
    loadChildren: () => import('./components/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  
  { path: '**', redirectTo: '/login' }
];