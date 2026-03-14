import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletService } from '../../services/wallet.service';

// Models
import { User } from '../../models/user.model';
import { DashboardStats } from '../../models/transaction.model';
import { Wallet } from '../../models/wallet.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule
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
    private router: Router
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
      })
    );
  }

  private loadDashboardData(): void {
  this.isLoading = true;
  
  // Charger les données en parallèle
  forkJoin({
    wallet: this.walletService.getWallet(true), // true pour forcer le rafraîchissement
    stats: this.transactionService.getUserDashboardStats()
  }).subscribe({
    next: (result) => {
      this.wallet = result.wallet;
      this.balance = result.wallet.balance;
      this.stats = result.stats;
      
      console.log('💰 Solde du wallet (base de données):', this.balance);
      console.log('📊 Stats transactions:', result.stats);
      
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Erreur chargement données:', error);
      this.isLoading = false;
    }
  });
}

  private loadWalletData(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.balance = wallet.balance; // TOUJOURS LA PRIORITÉ AU WALLET
        console.log('💰 Solde wallet (fallback):', this.balance);
      },
      error: (error) => {
        console.error('❌ Erreur chargement wallet:', error);
      }
    });
  }

  private loadStatsData(): void {
    this.transactionService.getUserDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement stats:', error);
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

  // Getters pour le template
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