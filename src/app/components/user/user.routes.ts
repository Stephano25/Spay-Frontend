// src/app/components/user/user.routes.ts
import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Tableau de bord (UserComponent lui-même)
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
  {
    path: 'transactions/:id',
    loadComponent: () => import('../transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
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

  // Scanner un ami (QR code)
  {
    path: 'scan-friend',
    loadComponent: () => import('../scan-friend/scan-friend.component').then(m => m.ScanFriendComponent)
  },

  // Paramètres utilisateur
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent)
  },

  // Redirection par défaut
  { path: '**', redirectTo: 'dashboard' }
];