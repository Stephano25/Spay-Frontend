import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AuthService } from '../../../services/auth.service';
import { WalletService } from '../../../services/wallet.service';
import { NotificationService } from '../../../services/notification.service';

// Models
import { User } from '../../../models/user.model';
import { Wallet, WalletStats, Transaction } from '../../../models/wallet.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTabsModule,
    MatGridListModule,
    MatListModule,
    MatTooltipModule
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnDestroy {
  user: User | null = null;
  wallet: Wallet | null = null;
  stats: WalletStats | null = null;
  recentTransactions: Transaction[] = [];
  
  isLoading = true;
  activeTab = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadWalletData();
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

  private loadWalletData(): void {
    this.isLoading = true;
    
    // Charger les statistiques du wallet
    this.subscriptions.push(
      this.walletService.getWalletStats().subscribe({
        next: (stats: WalletStats) => {
          this.stats = stats;
          this.recentTransactions = stats.recentTransactions || [];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement wallet stats:', error);
          this.isLoading = false;
        }
      })
    );

    // Charger les infos du wallet
    this.subscriptions.push(
      this.walletService.getWallet().subscribe({
        next: (wallet: Wallet) => {
          this.wallet = wallet;
        },
        error: (error: any) => {
          console.error('Erreur chargement wallet:', error);
        }
      })
    );
  }

  // Méthode pour retourner au tableau de bord
  goBackToDashboard(): void {
    this.router.navigate(['/user']);
  }

  navigateToSend(): void {
    this.router.navigate(['/wallet/send']);
  }

  navigateToReceive(): void {
    this.router.navigate(['/wallet/receive']);
  }

  navigateToScan(): void {
    this.router.navigate(['/scan-pay']);
  }

  navigateToMobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/wallet/history']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToFriends(): void {
    this.router.navigate(['/friends']);
  }

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/user/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward',
      'transfer': 'swap_horiz',
      'payment': 'payment',
      'mobile_money': 'phone_android'
    };
    return icons[type] || 'receipt';
  }

  getTransactionColor(type: string): string {
    const colors: Record<string, string> = {
      'deposit': 'positive',
      'withdrawal': 'negative',
      'transfer': 'neutral',
      'payment': 'neutral',
      'mobile_money': 'neutral'
    };
    return colors[type] || 'neutral';
  }

  getInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName?.charAt(0) || '') + 
           (this.user.lastName?.charAt(0) || '');
  }
}