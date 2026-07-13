// frontend/src/app/components/transactions/transactions.component.ts
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { Transaction } from '../../models/transaction.model';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../base.component';

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
    MatTooltipModule,
    MatRippleModule,
    MatDividerModule,
    TranslatePipe
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent extends BaseComponent implements OnInit {
  selectedTabIndex = 0;
  allTransactions: Transaction[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  totalReceived = 0;
  totalSent = 0;

  // Types de transactions
  private readonly INCOME_TYPES: Transaction['type'][] = ['deposit'];
  private readonly EXPENSE_TYPES: Transaction['type'][] = ['withdrawal', 'payment', 'mobile_money', 'transfer'];

  // Labels des types
  private readonly TYPE_LABELS: Record<string, string> = {
    'deposit': 'Dépôt',
    'withdrawal': 'Retrait',
    'transfer': 'Transfert',
    'payment': 'Paiement',
    'mobile_money': 'Mobile Money'
  };

  // Icônes des types
  private readonly TYPE_ICONS: Record<string, string> = {
    'deposit': 'arrow_downward',
    'withdrawal': 'arrow_upward',
    'payment': 'payment',
    'transfer': 'swap_horiz',
    'mobile_money': 'phone_android'
  };

  // Statuts
  private readonly STATUS_LABELS: Record<string, string> = {
    'completed': 'Réussi',
    'pending': 'En attente',
    'failed': 'Échoué',
    'cancelled': 'Annulé'
  };

  constructor(
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    super();
  }

  override ngOnInit(): void {
    this.loadTransactions();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

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
        console.error('❌ Erreur chargement transactions:', err);
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Impossible de charger les transactions.';
        this.notificationService.showError(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // ============================================================
  // CALCULS
  // ============================================================

  calculateTotals(): void {
    this.totalReceived = this.allTransactions
      .filter(t => this.INCOME_TYPES.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalSent = this.allTransactions
      .filter(t => this.EXPENSE_TYPES.includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // ============================================================
  // FILTRES
  // ============================================================

  get filteredTransactions(): Transaction[] {
    if (this.selectedTabIndex === 0) {
      return this.allTransactions;
    } else if (this.selectedTabIndex === 1) {
      return this.allTransactions.filter(t => t.type === 'deposit');
    } else if (this.selectedTabIndex === 2) {
      return this.allTransactions.filter(t => this.EXPENSE_TYPES.includes(t.type));
    }
    return this.allTransactions;
  }

  getReceivedCount(): number {
    return this.allTransactions.filter(t => t.type === 'deposit').length;
  }

  getSentCount(): number {
    return this.allTransactions.filter(t => this.EXPENSE_TYPES.includes(t.type)).length;
  }

  getFilteredTotal(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  getTransactionIcon(type: Transaction['type']): string {
    return this.TYPE_ICONS[type] || 'receipt';
  }

  getTransactionColor(type: Transaction['type']): string {
    if (type === 'deposit') return 'accent';
    if (this.EXPENSE_TYPES.includes(type)) return 'warn';
    return 'primary';
  }

  getStatusText(status: string): string {
    return this.STATUS_LABELS[status] || status;
  }

  getTypeLabel(type: string): string {
    return this.TYPE_LABELS[type] || type;
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

  // ============================================================
  // NAVIGATION
  // ============================================================

  viewDetails(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id]);
  }

  repeatTransaction(transaction: Transaction): void {
    this.router.navigate(['/wallet/send'], {
      queryParams: { 
        amount: transaction.amount, 
        description: transaction.description 
      }
    });
  }

  retry(): void {
    this.loadTransactions();
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}