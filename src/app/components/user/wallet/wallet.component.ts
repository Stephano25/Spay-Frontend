// src/app/components/wallet/wallet.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  trigger, transition, style, animate, stagger, query
} from '@angular/animations';

import { WalletService } from '../../../services/wallet.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Wallet } from '../../../models/wallet.model';
import { Transaction } from '../../../models/transaction.model';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const ANIMATIONS = [
  trigger('fadeUp', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(14px)' }),
      animate('400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),
  trigger('staggerFade', [
    transition(':enter', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        stagger('60ms', [
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]),
  trigger('listItem', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateX(-8px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ])
  ])
];

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
  animations: ANIMATIONS,
})
export class WalletComponent implements OnInit, OnDestroy {
  wallet: Wallet | null = null;

  // Statistiques calculées localement à partir des transactions
  totalDeposits = 0;
  totalWithdrawals = 0;
  totalTransactions = 0;
  recentTransactions: Transaction[] = [];

  isLoading = true;
  isRefreshing = false;
  hasError = false;
  errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

  private destroy$ = new Subject<void>();

  private readonly TRANSACTION_ICONS: Record<string, string> = {
    deposit: 'arrow_downward',
    withdrawal: 'arrow_upward',
    transfer: 'swap_horiz',
    payment: 'payment',
    mobile_money: 'phone_android',
    refund: 'replay',
  };

  private readonly STATUS_LABELS: Record<string, string> = {
    completed: 'Réussi',
    success: 'Réussi',
    pending: 'En attente',
    failed: 'Échoué',
    cancelled: 'Annulé',
  };

  private readonly EXPENSE_TYPES = new Set(['withdrawal', 'payment', 'transfer', 'mobile_money']);

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      wallet: this.walletService.getWallet(),
      transactions: this.transactionService.getAllTransactions(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isRefreshing = false;
        })
      )
      .subscribe({
        next: ({ wallet, transactions }) => {
          this.wallet = wallet;

          // Trier les transactions par date décroissante
          const sorted = [...transactions].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.recentTransactions = sorted.slice(0, 10);

          // Calculer les statistiques
          this.totalTransactions = transactions.length;
          this.totalDeposits = transactions
            .filter(t => t.type === 'deposit' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
          this.totalWithdrawals = transactions
            .filter(t => this.EXPENSE_TYPES.has(t.type) && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
        },
        error: (err) => {
          console.error('[WalletComponent] Erreur chargement données:', err);
          this.hasError = true;
          this.errorMessage = err?.error?.message ?? 'Impossible de charger les données.';
          this.notificationService.showError(this.errorMessage);
        }
      });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadData();
    this.notificationService.showInfo('Données actualisées');
  }

  // Navigation
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
  goBack(): void {
    this.router.navigate(['/user']);
  }
  viewTransactionDetails(txn: Transaction): void {
    this.router.navigate(['/transactions', txn.id]);
  }

  // Helpers d'affichage
  getTransactionIcon(txn: Transaction): string {
    return this.TRANSACTION_ICONS[txn.type] ?? 'receipt';
  }

  getTransactionClass(txn: Transaction): 'income' | 'expense' | 'transfer' {
    if (txn.type === 'transfer') return 'transfer';
    return this.EXPENSE_TYPES.has(txn.type) ? 'expense' : 'income';
  }

  getAmountClass(txn: Transaction): 'positive' | 'negative' {
    return this.EXPENSE_TYPES.has(txn.type) ? 'negative' : 'positive';
  }

  getAmountSign(txn: Transaction): string {
    return this.EXPENSE_TYPES.has(txn.type) ? '−' : '+';
  }

  getStatusLabel(status: string): string {
    return this.STATUS_LABELS[status?.toLowerCase()] ?? status ?? '—';
  }

  formatAmount(amount: number | null | undefined): string {
    const value = amount ?? 0;
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  trackById(_: number, txn: Transaction): string | number {
    return txn.id;
  }
}