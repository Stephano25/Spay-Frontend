import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { WalletService } from '../../services/wallet.service';

// Models
import { User } from '../../models/user.model';
import { DashboardStats, Transaction } from '../../models/transaction.model';

// Components
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { NavigationHeaderComponent } from '../layout/navigation-header/navigation-header.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    NavigationHeaderComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardStats | null = null;
  recentTransactions: Transaction[] = [];
  walletBalance: number = 0;
  walletCurrency: string = 'Ar';
  isLoading = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadWalletData();
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.subscriptions.push(
      this.authService.currentUser.subscribe((user: User | null) => {
        this.user = user;
        console.log('User chargé:', user);
      })
    );
  }

  private loadWalletData(): void {
    this.subscriptions.push(
      this.walletService.getWallet().subscribe({
        next: (wallet: any) => {
          this.walletBalance = wallet.balance || 0;
          this.walletCurrency = wallet.currency || 'Ar';
          console.log('Wallet chargé:', wallet);
        },
        error: (error: any) => {
          console.error('Erreur chargement wallet:', error);
          // Fallback sur le balance de l'utilisateur si wallet échoue
          if (this.user?.balance) {
            this.walletBalance = this.user.balance;
          }
        }
      })
    );
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.transactionService.getUserDashboardStats().subscribe({
        next: (data: DashboardStats) => {
          this.stats = data;
          this.recentTransactions = data.lastThreeTransactions || [];
          
          // Si les stats contiennent le totalBalance et que walletBalance est 0, on l'utilise
          if (data.totalBalance > 0 && this.walletBalance === 0) {
            this.walletBalance = data.totalBalance;
          }
          
          this.isLoading = false;
          console.log('Stats chargées:', data);
        },
        error: (error: any) => {
          console.error('Erreur chargement stats:', error);
          this.isLoading = false;
        }
      })
    );
  }

  // Getter pour obtenir le solde à afficher
  get displayBalance(): number {
    // Priorité: walletBalance > stats.totalBalance > user.balance
    if (this.walletBalance > 0) {
      return this.walletBalance;
    }
    if (this.stats?.totalBalance) {
      return this.stats.totalBalance;
    }
    if (this.user?.balance) {
      return this.user.balance;
    }
    return 0;
  }

  navigateToScan(): void {
    this.router.navigate(['/scan-pay']);
  }

  navigateToSend(): void {
    this.router.navigate(['/wallet/send']);
  }

  navigateToMobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }

  navigateToFriends(): void {
    this.router.navigate(['/friends']);
  }

  navigateToTransactions(): void {
    this.router.navigate(['/wallet/history']);
  }

  logout(): void {
    this.authService.logout();
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      'transfer': 'swap_horiz',
      'payment': 'payment',
      'mobile_money': 'phone_android',
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward'
    };
    return icons[type] || 'receipt';
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }
}