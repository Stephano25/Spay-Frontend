// frontend/src/app/components/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminGuard } from '../../guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/admin-profile.component').then(
        (m) => m.AdminProfileComponent,
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/admin-users.component').then((m) => m.AdminUsersComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./transactions/admin-transactions.component').then(
        (m) => m.AdminTransactionsComponent,
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./stats/admin-stats.component').then((m) => m.AdminStatsComponent),
    canActivate: [AdminGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(
        (m) => m.AdminSettingsComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ⚠️ Route ADMINISTRATEURS - UNIQUEMENT SUPER_ADMIN
  {
    path: 'admins',
    loadComponent: () =>
      import('./admins/admin-admins.component').then(
        (m) => m.AdminAdminsComponent,
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'admins/create',
    loadComponent: () =>
      import('./admins/admin-create/admin-create.component').then(
        (m) => m.AdminCreateComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ DÉPÔT et RETRAIT - ACCESSIBLES À TOUS LES ADMINS
  {
    path: 'deposit',
    loadComponent: () =>
      import('./deposit/admin-deposit.component').then(
        (m) => m.AdminDepositComponent,
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'withdraw',
    loadComponent: () =>
      import('./withdraw/admin-withdraw.component').then(
        (m) => m.AdminWithdrawComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : WALLET ADMIN
  {
    path: 'wallet',
    loadComponent: () =>
      import('../user/wallet/wallet.component').then(
        (m) => m.WalletComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : WALLET ADMIN - Envoyer
  {
    path: 'wallet/send',
    loadComponent: () =>
      import('../user/wallet/send-money/send-money.component').then(
        (m) => m.SendMoneyComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : WALLET ADMIN - Recevoir
  {
    path: 'wallet/receive',
    loadComponent: () =>
      import('../user/wallet/receive-money/receive-money.component').then(
        (m) => m.ReceiveMoneyComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : FRIENDS ADMIN
  {
    path: 'friends',
    loadComponent: () =>
      import('../friends/friends.component').then(
        (m) => m.FriendsComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : CHAT ADMIN
  {
    path: 'chat',
    loadComponent: () =>
      import('../chat/chat.component').then(
        (m) => m.ChatComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : MOBILE MONEY ADMIN
  {
    path: 'mobile-money',
    loadComponent: () =>
      import('../mobile-money/mobile-money.component').then(
        (m) => m.MobileMoneyComponent,
      ),
    canActivate: [AdminGuard],
  },
  // ✅ NOUVEAU : SCAN PAY ADMIN
  {
    path: 'scan-pay',
    loadComponent: () =>
      import('../scan-pay/scan-pay.component').then(
        (m) => m.ScanPayComponent,
      ),
    canActivate: [AdminGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];