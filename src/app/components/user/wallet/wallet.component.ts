import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// Services
import { WalletService, WalletStats } from '../../../services/wallet.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';

// Models
import { Transaction } from '../../../models/transaction.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

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
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  wallet: any = null;
  stats: WalletStats | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = true;
  activeTab = 0;

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
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
      next: (stats: WalletStats) => {
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

  sendMoney(): void {
    this.router.navigate(['/wallet/send']);
  }

  receiveMoney(): void {
    this.router.navigate(['/wallet/receive']);
  }

  mobileMoney(): void {
    this.router.navigate(['/mobile-money']);
  }

  scanQR(): void {
    this.router.navigate(['/scan-pay']);
  }

  viewAllTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id]);
  }

  repeatTransaction(transaction: Transaction): void {
    if (transaction.type === 'transfer' && transaction.receiverId) {
      this.router.navigate(['/wallet/send'], {
        queryParams: {
          receiverId: transaction.receiverId,
          amount: transaction.amount,
          description: transaction.description
        }
      });
    } else {
      this.notificationService.showInfo('Cette transaction ne peut pas être répétée');
    }
  }

  downloadReceipt(transaction: Transaction): void {
    const receipt = {
      id: transaction.id,
      date: transaction.createdAt,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status
    };
    
    const dataStr = JSON.stringify(receipt, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `transaction-${transaction.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.notificationService.showSuccess('Reçu téléchargé');
  }

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
    this.notificationService.showInfo('Données actualisées');
  }

  goBack(): void {
    this.router.navigate(['/user']);
  }
}