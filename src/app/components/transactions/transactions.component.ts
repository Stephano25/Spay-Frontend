// src/app/components/transactions/transactions.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatTabsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  selectedTabIndex = 0;
  allTransactions: Transaction[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  totalReceived = 0;
  totalSent = 0;

  constructor(
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.hasError = false;
    this.transactionService.getAllTransactions().subscribe({
      next: (transactions) => {
        this.allTransactions = transactions.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateTotals();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Impossible de charger les transactions.';
        this.notificationService.showError(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    const incomeTypes: Transaction['type'][] = ['deposit'];
    const expenseTypes: Transaction['type'][] = ['withdrawal', 'payment', 'mobile_money', 'transfer'];

    this.totalReceived = this.allTransactions
      .filter(t => incomeTypes.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalSent = this.allTransactions
      .filter(t => expenseTypes.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get filteredTransactions(): Transaction[] {
    if (this.selectedTabIndex === 0) {
      return this.allTransactions;
    } else if (this.selectedTabIndex === 1) {
      return this.allTransactions.filter(t => t.type === 'deposit');
    } else if (this.selectedTabIndex === 2) {
      const expenseTypes: Transaction['type'][] = ['withdrawal', 'payment', 'transfer', 'mobile_money'];
      return this.allTransactions.filter(t => expenseTypes.includes(t.type));
    }
    return this.allTransactions;
  }

  getTransactionIcon(type: Transaction['type']): string {
    switch (type) {
      case 'deposit': return 'arrow_downward';
      case 'withdrawal': return 'arrow_upward';
      case 'payment': return 'payment';
      case 'transfer': return 'swap_horiz';
      case 'mobile_money': return 'phone_android';
      default: return 'receipt';
    }
  }

  getTransactionColor(type: Transaction['type']): string {
    if (type === 'deposit') return 'accent';
    if (['withdrawal', 'payment', 'transfer', 'mobile_money'].includes(type)) return 'warn';
    return 'primary';
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      completed: 'Réussi',
      pending: 'En attente',
      failed: 'Échoué',
      cancelled: 'Annulé'
    };
    return map[status] || status;
  }

  getCounterparty(transaction: Transaction): string {
    if (transaction.type === 'deposit' && transaction.sender) {
      return `De: ${transaction.sender.firstName} ${transaction.sender.lastName}`;
    }
    if (transaction.type !== 'deposit' && transaction.receiver) {
      return `À: ${transaction.receiver.firstName} ${transaction.receiver.lastName}`;
    }
    return '';
  }

  viewDetails(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id]);
  }

  repeatTransaction(transaction: Transaction): void {
    this.router.navigate(['/wallet/send'], {
      queryParams: { amount: transaction.amount, description: transaction.description }
    });
  }

  retry(): void {
    this.loadTransactions();
  }
}