// src/app/components/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminProfileComponent } from './profile/admin-profile.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminTransactionsComponent } from './transactions/admin-transactions.component';
import { AdminStatsComponent } from './stats/admin-stats.component';
import { AdminSettingsComponent } from './settings/settings.component'; // ← Correction ici

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'profile', component: AdminProfileComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'transactions', component: AdminTransactionsComponent },
  { path: 'stats', component: AdminStatsComponent },
  { path: 'settings', component: AdminSettingsComponent }
];