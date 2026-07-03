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
  { path: '**', redirectTo: 'dashboard' },
];