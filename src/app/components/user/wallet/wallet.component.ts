// frontend/src/app/components/user/wallet/wallet.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

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
    TranslatePipe,
  ],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
  animations: ANIMATIONS,
})
export class WalletComponent implements OnInit, OnDestroy {
  wallet: Wallet | null = null;

  totalDeposits = 0;
  totalWithdrawals = 0;
  totalTransactions = 0;
  recentTransactions: Transaction[] = [];

  isLoading = true;
  isRefreshing = false;
  hasError = false;
  errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

  private destroy$ = new Subject<void>();
  private subscriptions: any[] = [];

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
    private translationService: TranslationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // S'abonner aux changements de langue
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 WalletComponent: Langue changée en ${lang}`);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Nettoyer les souscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

          const sorted = [...transactions].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.recentTransactions = sorted.slice(0, 10);

          this.totalTransactions = transactions.length;
          this.totalDeposits = transactions
            .filter(t => t.type === 'deposit' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
          this.totalWithdrawals = transactions
            .filter(t => this.EXPENSE_TYPES.has(t.type) && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
            
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[WalletComponent] Erreur chargement données:', err);
          this.hasError = true;
          this.errorMessage = err?.error?.message ?? 'Impossible de charger les données.';
          this.notificationService.showError(this.errorMessage);
          this.cdr.detectChanges();
        }
      });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadData();
    this.notificationService.showInfo('Données actualisées');
  }

  sendMoney(): void {
    console.log('🔵 Navigation vers Envoyer de l\'argent');
    this.router.navigate(['/user/wallet/send']).catch(err => {
      console.error('❌ Erreur navigation sendMoney:', err);
      this.router.navigate(['/wallet/send']).catch(err2 => {
        console.error('❌ Erreur fallback sendMoney:', err2);
        this.router.navigate(['/send-money']);
      });
    });
  }

  receiveMoney(): void {
    console.log('🔵 Navigation vers Recevoir de l\'argent');
    this.router.navigate(['/user/wallet/receive']).catch(err => {
      console.error('❌ Erreur navigation receiveMoney:', err);
      this.router.navigate(['/wallet/receive']).catch(err2 => {
        console.error('❌ Erreur fallback receiveMoney:', err2);
        this.router.navigate(['/receive-money']);
      });
    });
  }

  mobileMoney(): void {
    console.log('🔵 Navigation vers Mobile Money');
    this.router.navigate(['/user/mobile-money']).catch(err => {
      console.error('❌ Erreur navigation mobileMoney:', err);
      this.router.navigate(['/mobile-money']);
    });
  }

  scanQR(): void {
    console.log('🔵 Navigation vers Scanner QR');
    this.router.navigate(['/user/scan-pay']).catch(err => {
      console.error('❌ Erreur navigation scanQR:', err);
      this.router.navigate(['/scan-pay']);
    });
  }

  viewAllTransactions(): void {
    console.log('🔵 Navigation vers Historique des transactions');
    this.router.navigate(['/user/transactions']).catch(err => {
      console.error('❌ Erreur navigation viewAllTransactions:', err);
      this.router.navigate(['/transactions']);
    });
  }

  goBack(): void {
    console.log('🔵 Navigation vers tableau de bord');
    this.router.navigate(['/user/dashboard']).catch(err => {
      console.error('❌ Erreur navigation goBack:', err);
      this.router.navigate(['/dashboard']);
    });
  }

  viewTransactionDetails(txn: Transaction): void {
    console.log('🔵 Navigation vers détails transaction:', txn.id);
    this.router.navigate(['/user/transactions', txn.id]).catch(err => {
      console.error('❌ Erreur navigation viewTransactionDetails:', err);
      this.router.navigate(['/transactions', txn.id]);
    });
  }

  getTransactionIcon(txn: Transaction): string {
    return this.TRANSACTION_ICONS[txn.type] ?? 'receipt';
  }

  getTransactionClass(txn: Transaction): string {
    if (txn.type === 'transfer') return 'transfer';
    return this.EXPENSE_TYPES.has(txn.type) ? 'expense' : 'income';
  }

  getAmountClass(txn: Transaction): string {
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