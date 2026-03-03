import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { UserComponent } from './components/user/user.component';
import { AdminComponent } from './components/admin/admin.component'; // Vérifier ce chemin
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { ChatComponent } from './components/chat/chat.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ScanPayComponent } from './components/scan-pay/scan-pay.component';
import { MobileMoneyComponent } from './components/mobile-money/mobile-money.component';
import { FriendsComponent } from './components/friends/friends.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Routes utilisateur
  { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'scan-pay', component: ScanPayComponent, canActivate: [AuthGuard] },
  { path: 'mobile-money', component: MobileMoneyComponent, canActivate: [AuthGuard] },
  { path: 'friends', component: FriendsComponent, canActivate: [AuthGuard] },

  // Routes admin
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent }
    ]
  },
  { 
    path: 'admin/users', 
    loadComponent: () => import('./components/admin/users/users.component').then(m => m.UsersComponent),
    canActivate: [AdminGuard]
  },
  { 
    path: 'admin/transactions', 
    loadComponent: () => import('./components/admin/transactions/transactions.component').then(m => m.AdminTransactionsComponent),
    canActivate: [AdminGuard]
  },
  { 
    path: 'admin/stats', 
    loadComponent: () => import('./components/admin/stats/stats.component').then(m => m.AdminStatsComponent),
    canActivate: [AdminGuard]
  },
  { 
    path: 'admin/settings', 
    loadComponent: () => import('./components/admin/settings/settings.component').then(m => m.AdminSettingsComponent),
    canActivate: [AdminGuard]
  },

  { path: '**', redirectTo: '/login' }
];