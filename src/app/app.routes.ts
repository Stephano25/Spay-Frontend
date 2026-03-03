import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { UserComponent } from './components/user/user.component';
import { WalletComponent } from './components/user/wallet/wallet.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { ChatComponent } from './components/chat/chat.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ScanPayComponent } from './components/scan-pay/scan-pay.component';
import { MobileMoneyComponent } from './components/mobile-money/mobile-money.component';
import { FriendsComponent } from './components/friends/friends.component';
import { UserSettingsComponent } from './components/user/settings/settings.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SendMoneyComponent } from './components/user/wallet/send-money/send-money.component';
import { ReceiveMoneyComponent } from './components/user/wallet/receive-money/receive-money.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Routes utilisateur (portefeuille)
  { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'wallet', component: WalletComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'scan-pay', component: ScanPayComponent, canActivate: [AuthGuard] },
  { path: 'mobile-money', component: MobileMoneyComponent, canActivate: [AuthGuard] },
  { path: 'friends', component: FriendsComponent, canActivate: [AuthGuard] },
  { path: 'user/settings', component: UserSettingsComponent, canActivate: [AuthGuard] },

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

  // Ajouter ces routes dans la section utilisateur
  { path: 'wallet/send', component: SendMoneyComponent, canActivate: [AuthGuard] },
  { path: 'wallet/receive', component: ReceiveMoneyComponent, canActivate: [AuthGuard] },
  { path: 'wallet/history', component: TransactionsComponent, canActivate: [AuthGuard] },
  
  { path: '**', redirectTo: '/login' }
];