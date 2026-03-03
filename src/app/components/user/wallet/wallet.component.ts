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
import { MatListModule } from '@angular/material/list'; // AJOUTER

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
    MatListModule // AJOUTER
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
    
    // Charger les données du portefeuille
    this.subscriptions.push(
      this.walletService.getWalletStats().subscribe({
        next: (stats: WalletStats) => {
          this.stats = stats;
          this.recentTransactions = stats.recentTransactions;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement wallet:', error);
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

  /**
   * Naviguer vers l'envoi d'argent
   */
  navigateToSend(): void {
    this.router.navigate(['/wallet/send']);
  }

  /**
   * Naviguer vers la réception d'argent
   */
  navigateToReceive(): void {
    this.router.navigate(['/wallet/receive']);
  }

  /**
   * Naviguer vers le scan QR
   */
  navigateToScan(): void {
    this.router.navigate(['/scan-pay']);
  }

  /**
   * Naviguer vers Mobile Money
   */
  navigateToMobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  /**
   * Naviguer vers l'historique
   */
  navigateToHistory(): void {
    this.router.navigate(['/wallet/history']);
  }

  /**
   * Formater le montant
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Obtenir l'icône de transaction
   */
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

  /**
   * Obtenir la couleur de transaction
   */
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

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
  }
}