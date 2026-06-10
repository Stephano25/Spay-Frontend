// src/app/components/user/user.routes.ts
import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./user.component').then(m => m.UserComponent)
  },
  {
    path: 'wallet',
    loadComponent: () => import('../user/wallet/wallet.component').then(m => m.WalletComponent)
  },
  {
    path: 'chat',
    loadComponent: () => import('../chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'friends',
    loadComponent: () => import('../friends/friends.component').then(m => m.FriendsComponent)
  },
  {
    path: 'transactions',
    loadComponent: () => import('../transactions/transactions.component').then(m => m.TransactionsComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'mobile-money',
    loadComponent: () => import('../mobile-money/mobile-money.component').then(m => m.MobileMoneyComponent)
  },
  {
    path: 'scan-pay',
    loadComponent: () => import('../scan-pay/scan-pay.component').then(m => m.ScanPayComponent)
  },
  {
    path: 'user/settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];