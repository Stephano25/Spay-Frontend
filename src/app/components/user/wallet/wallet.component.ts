import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Services
import { WalletService } from '../../../services/wallet.service';
import { TransactionService } from '../../../services/transaction.service';

// Models
import { Wallet, WalletStats, Transaction } from '../../../models/wallet.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  wallet: Wallet | null = null;
  stats: WalletStats | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = true;
  activeTab = 0;

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.loadStats();
      },
      error: (error) => {
        console.error('❌ Erreur chargement wallet:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.walletService.getWalletStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.recentTransactions = stats.recentTransactions || [];
        this.isLoading = false;
        console.log('📊 Stats wallet chargées:', stats);
      },
      error: (error) => {
        console.error('❌ Erreur chargement stats wallet:', error);
        this.isLoading = false;
      }
    });
  }

  // Méthodes de navigation
  goBack(): void {
    this.router.navigate(['/user']);
  }

  sendMoney(): void {
    this.router.navigate(['/wallet/send']);
  }

  receiveMoney(): void {
    this.router.navigate(['/wallet/receive']);
  }

  scanQR(): void {
    this.router.navigate(['/scan-pay']);
  }

  mobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  viewAllTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  // Méthodes utilitaires
  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionIcon(transaction: Transaction): string {
    const icons: Record<string, string> = {
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward',
      'transfer': 'swap_horiz',
      'payment': 'payment',
      'mobile_money': 'phone_android'
    };
    return icons[transaction.type] || 'receipt';
  }

  getTransactionClass(transaction: Transaction): string {
    return transaction.type === 'withdrawal' ? 'expense' : 'income';
  }

  getAmountClass(transaction: Transaction): string {
    return transaction.type === 'withdrawal' ? 'negative' : 'positive';
  }

  getAmountSign(transaction: Transaction): string {
    return transaction.type === 'withdrawal' ? '-' : '+';
  }

  refreshData(): void {
    this.loadData();
  }
}