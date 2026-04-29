import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Animations
import {
  trigger, state, style, transition,
  animate, stagger, query, keyframes
} from '@angular/animations';

// Services
import { WalletService, WalletStats } from '../../../services/wallet.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';

// Models
import { Wallet } from '../../../models/wallet.model';
import { Transaction } from '../../../models/transaction.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

/** ─────────────────────────────────────────────
 *  Animation definitions
 * ───────────────────────────────────────────── */
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

/** ─────────────────────────────────────────────
 *  Component
 * ───────────────────────────────────────────── */
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

  // ── State ──
  wallet:             Wallet | null   = null;
  stats:              WalletStats | null = null;
  recentTransactions: Transaction[]   = [];
  isLoading   = true;
  isRefreshing = false;
  hasError    = false;
  errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

  private destroy$ = new Subject<void>();

  // ── Icon & label maps ──
  private readonly TRANSACTION_ICONS: Record<string, string> = {
    deposit:      'arrow_downward',
    withdrawal:   'arrow_upward',
    transfer:     'swap_horiz',
    payment:      'payment',
    mobile_money: 'phone_android',
    refund:       'replay',
  };

  private readonly STATUS_LABELS: Record<string, string> = {
    completed:  'Réussi',
    success:    'Réussi',
    pending:    'En attente',
    failed:     'Échoué',
    cancelled:  'Annulé',
  };

  private readonly EXPENSE_TYPES = new Set(['withdrawal', 'payment', 'fee']);

  // ── Constructor ──
  constructor(
    private walletService:      WalletService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router:             Router,
  ) {}

  // ── Lifecycle ──
  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──

  /**
   * Charge le wallet et les stats en parallèle via forkJoin
   * pour réduire le temps total de chargement.
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError  = false;

    forkJoin({
      wallet: this.walletService.getWallet(),
      stats:  this.walletService.getWalletStats(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoading = false; this.isRefreshing = false; })
      )
      .subscribe({
        next: ({ wallet, stats }) => {
          this.wallet             = wallet;
          this.stats              = stats;
          this.recentTransactions = (stats.recentTransactions ?? []).slice(0, 10);
        },
        error: (err) => {
          console.error('[WalletComponent] Erreur chargement données:', err);
          this.hasError    = true;
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

  // ── Navigation ──
  sendMoney():          void { this.router.navigate(['/wallet/send']); }
  receiveMoney():       void { this.router.navigate(['/wallet/receive']); }
  mobileMoney():        void { this.router.navigate(['/mobile-money']); }
  scanQR():             void { this.router.navigate(['/scan-pay']); }
  viewAllTransactions():void { this.router.navigate(['/transactions']); }
  goBack():             void { this.router.navigate(['/user']); }

  viewTransactionDetails(txn: Transaction): void {
    this.router.navigate(['/transactions', txn.id]);
  }

  // ── Helpers — transactions ──

  /** Retourne l'icône Material correspondant au type de transaction */
  getTransactionIcon(txn: Transaction): string {
    return this.TRANSACTION_ICONS[txn.type] ?? 'receipt';
  }

  /** Classe CSS pour l'icône (income / expense / transfer) */
  getTransactionClass(txn: Transaction): 'income' | 'expense' | 'transfer' {
    if (txn.type === 'transfer') return 'transfer';
    return this.EXPENSE_TYPES.has(txn.type) ? 'expense' : 'income';
  }

  /** Classe CSS pour le montant (positive / negative) */
  getAmountClass(txn: Transaction): 'positive' | 'negative' {
    return this.EXPENSE_TYPES.has(txn.type) ? 'negative' : 'positive';
  }

  /** Signe (+/-) devant le montant */
  getAmountSign(txn: Transaction): string {
    return this.EXPENSE_TYPES.has(txn.type) ? '−' : '+';
  }

  /** Libellé lisible du statut */
  getStatusLabel(status: string): string {
    return this.STATUS_LABELS[status?.toLowerCase()] ?? status ?? '—';
  }

  // ── Helpers — formatting ──

  /**
   * Formate un montant en Ariary avec séparateurs de milliers.
   * Exemple : 1250000 → "1 250 000"
   */
  formatAmount(amount: number | null | undefined): string {
    const value = amount ?? 0;
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // ── TrackBy ──
  trackById(_: number, txn: Transaction): string | number {
    return txn.id;
  }
}