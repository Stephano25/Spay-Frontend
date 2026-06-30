// ============================================================
// USER ROUTES - SPaye
// ============================================================

import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  // Redirection par défaut vers dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('./user.component').then(m => m.UserComponent)
  },

  // Portefeuille
  {
    path: 'wallet',
    loadComponent: () => import('./wallet/wallet.component').then(m => m.WalletComponent)
  },
  {
    path: 'wallet/send',
    loadComponent: () => import('./wallet/send-money/send-money.component').then(m => m.SendMoneyComponent)
  },
  {
    path: 'wallet/receive',
    loadComponent: () => import('./wallet/receive-money/receive-money.component').then(m => m.ReceiveMoneyComponent)
  },

  // Chat
  {
    path: 'chat',
    loadComponent: () => import('../chat/chat.component').then(m => m.ChatComponent)
  },

  // Amis
  {
    path: 'friends',
    loadComponent: () => import('../friends/friends.component').then(m => m.FriendsComponent)
  },

  // Transactions
  {
    path: 'transactions',
    loadComponent: () => import('../transactions/transactions.component').then(m => m.TransactionsComponent)
  },

  // Profil
  {
    path: 'profile',
    loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent)
  },

  // Mobile Money
  {
    path: 'mobile-money',
    loadComponent: () => import('../mobile-money/mobile-money.component').then(m => m.MobileMoneyComponent)
  },

  // Scan & Pay
  {
    path: 'scan-pay',
    loadComponent: () => import('../scan-pay/scan-pay.component').then(m => m.ScanPayComponent)
  },

  // Paramètres
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent)
  },

  // Redirection 404
  { path: '**', redirectTo: 'dashboard' }
];