// src/app/components/user/user.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletService } from '../../services/wallet.service';
import { TranslationService } from '../../services/translation.service';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/transaction.model';
import { Wallet } from '../../models/wallet.model';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  wallet: Wallet | null = null;
  balance: number = 0;
  stats: DashboardStats | null = null;
  isLoading = true;
  profileImageUrl: string | null = null;
  
  menuItems = [
    { icon: 'account_balance_wallet', label: 'Portefeuille', route: '/wallet' },
    { icon: 'chat', label: 'Messages', route: '/chat' },
    { icon: 'swap_horiz', label: 'Transactions', route: '/transactions' },
    { icon: 'person', label: 'Profil', route: '/profile' },
    { icon: 'qr_code_scanner', label: 'Scanner', route: '/scan-pay' },
    { icon: 'phone_android', label: 'Mobile Money', route: '/mobile-money' },
    { icon: 'people', label: 'Amis', route: '/friends' },
    { icon: 'settings', label: 'Paramètres', route: '/user/settings' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private router: Router,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
        if (user?.profilePicture) {
          this.profileImageUrl = this.getFullImageUrl(user.profilePicture);
        }
      })
    );
  }

  getFullImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
      return `${environment.baseUrl}${url}`;
    }
    return url;
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + (this.user.lastName?.charAt(0) || '');
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    forkJoin({
      wallet: this.walletService.getWallet(),
      stats: this.transactionService.getUserDashboardStats()
    }).subscribe({
      next: (result) => {
        this.wallet = result.wallet;
        this.balance = result.wallet?.balance || 0;
        this.stats = result.stats;
        console.log('💰 Solde du wallet:', this.balance);
        console.log('📊 Stats transactions:', result.stats);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement données:', error);
        this.isLoading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  get hasStats(): boolean {
    return this.stats !== null;
  }

  get totalTransactions(): number {
    return this.stats?.totalTransactions || 0;
  }

  get largestTransactionAmount(): number {
    return this.stats?.largestTransaction?.amount || 0;
  }

  get hasLargestTransaction(): boolean {
    return !!this.stats?.largestTransaction;
  }
}