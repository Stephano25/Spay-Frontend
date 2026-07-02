// frontend/src/app/components/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/admin-profile.component').then(
        (m) => m.AdminProfileComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/admin-users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./transactions/admin-transactions.component').then(
        (m) => m.AdminTransactionsComponent
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./stats/admin-stats.component').then((m) => m.AdminStatsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(
        (m) => m.AdminSettingsComponent
      ),
  },
  {
    path: 'admins',
    loadComponent: () =>
      import('./admins/admin-admins.component').then(
        (m) => m.AdminAdminsComponent
      ),
  },
  {
    path: 'deposit',
    loadComponent: () =>
      import('./deposit/admin-deposit.component').then(
        (m) => m.AdminDepositComponent
      ),
  },
  {
    path: 'withdraw',
    loadComponent: () =>
      import('./withdraw/admin-withdraw.component').then(
        (m) => m.AdminWithdrawComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard' }
];