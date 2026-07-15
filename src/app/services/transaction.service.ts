// frontend/src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Transaction, DashboardStats } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  // ============================================================
  // STATISTIQUES
  // ============================================================

  getUserDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/user/stats`).pipe(
      tap(data => console.log('📊 Stats user:', data)),
      catchError(error => {
        this.notificationService.showError('Erreur chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/all`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  getTransactions(page: number = 1, limit: number = 50): Observable<{ transactions: Transaction[], total: number }> {
    return this.http.get<{ transactions: Transaction[], total: number }>(`${this.apiUrl}`, { 
      params: { page, limit } 
    }).pipe(
      tap(data => console.log('📋 Transactions chargées:', data.transactions.length)),
      catchError(error => {
        this.notificationService.showError('Erreur chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  getUserTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/user`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // COMMISSIONS - CALCUL
  // ============================================================

  /**
   * Calcule les commissions pour une transaction
   * @param amount - Montant de la transaction
   * @param type - Type de transaction
   * @param adminId - ID de l'admin qui effectue le retrait (optionnel)
   */
  calculateCommission(amount: number, type: string, adminId?: string): {
    superAdminCommission: number;
    adminCommission: number;
    totalCommission: number;
    breakdown: string;
  } {
    let superAdminCommission = 0;
    let adminCommission = 0;
    let totalCommission = 0;
    let breakdown = '';

    if (type === 'user_transfer') {
      // ✅ Transaction utilisateur → utilisateur : 1.5% pour Super Admin
      superAdminCommission = amount * 0.015;
      totalCommission = superAdminCommission;
      breakdown = `Super Admin: ${superAdminCommission.toFixed(2)} Ar (1.5%)`;
    } 
    else if (type === 'admin_withdrawal' && adminId) {
      // ✅ Retrait utilisateur → Admin : 1% Super Admin + 0.5% Admin
      superAdminCommission = amount * 0.01;
      adminCommission = amount * 0.005;
      totalCommission = superAdminCommission + adminCommission;
      breakdown = `Super Admin: ${superAdminCommission.toFixed(2)} Ar (1%) + Admin: ${adminCommission.toFixed(2)} Ar (0.5%)`;
    }
    else if (type === 'admin_deposit') {
      // ✅ Dépôt Admin → Utilisateur : 1% pour Super Admin
      superAdminCommission = amount * 0.01;
      totalCommission = superAdminCommission;
      breakdown = `Super Admin: ${superAdminCommission.toFixed(2)} Ar (1%)`;
    }

    return {
      superAdminCommission,
      adminCommission,
      totalCommission,
      breakdown
    };
  }

  /**
   * Crée une transaction avec commission
   */
  createTransactionWithCommission(
    transactionData: any,
    commissionData: {
      superAdminId: string;
      adminId?: string;
      type: 'user_transfer' | 'admin_withdrawal' | 'admin_deposit';
    }
  ): Observable<Transaction> {
    const amount = transactionData.amount;
    const commission = this.calculateCommission(amount, commissionData.type, commissionData.adminId);

    const payload = {
      ...transactionData,
      commission: {
        total: commission.totalCommission,
        superAdminCommission: commission.superAdminCommission,
        adminCommission: commission.adminCommission,
        superAdminId: commissionData.superAdminId,
        adminId: commissionData.adminId || null,
        type: commissionData.type,
        rate: commissionData.type === 'user_transfer' ? 1.5 : commissionData.type === 'admin_withdrawal' ? 1.0 : 1.0,
        breakdown: commission.breakdown
      }
    };

    return this.http.post<Transaction>(`${this.apiUrl}/with-commission`, payload).pipe(
      tap((tx) => {
        console.log('💰 Transaction avec commission créée:', tx);
        this.notificationService.showSuccess(
          `Transaction effectuée avec ${commission.totalCommission.toFixed(2)} Ar de commission`
        );
      }),
      catchError((error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de la transaction');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // ENVOI D'ARGENT - MODIFIÉ AVEC COMMISSION
  // ============================================================

  sendMoney(data: { receiverId: string; amount: number; description?: string }): Observable<Transaction> {
    // ✅ Calculer la commission pour Super Admin (1.5%)
    const commission = this.calculateCommission(data.amount, 'user_transfer');
    
    const payload = {
      ...data,
      commission: {
        total: commission.totalCommission,
        superAdminCommission: commission.superAdminCommission,
        type: 'user_transfer',
        rate: 1.5,
        breakdown: commission.breakdown
      }
    };

    return this.http.post<Transaction>(`${this.apiUrl}/send`, payload).pipe(
      tap(() => {
        this.notificationService.showSuccess(
          `Argent envoyé avec succès (Commission: ${commission.totalCommission.toFixed(2)} Ar)`
        );
      }),
      catchError((error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de l\'envoi');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // RETRAIT ADMIN - MODIFIÉ AVEC COMMISSION
  // ============================================================

  /**
   * Retrait Admin → Utilisateur - MODIFIÉ pour inclure la commission
   */
  adminWithdraw(userId: string, amount: number, adminId: string, description?: string): Observable<Transaction> {
    // ✅ Calculer la commission (1% Super Admin + 0.5% Admin)
    const commission = this.calculateCommission(amount, 'admin_withdrawal', adminId);
    
    const payload = {
      userId,
      amount,
      adminId,
      description: description || `Retrait par Admin ${adminId}`,
      commission: {
        total: commission.totalCommission,
        superAdminCommission: commission.superAdminCommission,
        adminCommission: commission.adminCommission,
        superAdminId: 'SUPER_ADMIN_ID', // À remplacer par l'ID réel du Super Admin
        adminId: adminId,
        type: 'admin_withdrawal',
        rate: 1.0,
        breakdown: commission.breakdown
      }
    };

    return this.http.post<Transaction>(`${this.apiUrl}/admin-withdraw`, payload).pipe(
      tap(() => {
        this.notificationService.showSuccess(
          `Retrait effectué (Commission: ${commission.totalCommission.toFixed(2)} Ar)`
        );
      }),
      catchError((error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du retrait');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // MOBILE MONEY
  // ============================================================

  mobileMoneyTransfer(data: { operator: string; phoneNumber: string; amount: number }): Observable<Transaction> {
    const cleanData = {
      operator: data.operator,
      phoneNumber: data.phoneNumber.replace(/\s/g, ''),
      amount: Number(data.amount)
    };
    return this.http.post<Transaction>(`${this.apiUrl}/mobile-money`, cleanData).pipe(
      tap(() => this.notificationService.showSuccess(
        `Transfert Mobile Money de ${this.formatAmount(data.amount)} Ar vers ${data.operator} effectué !`
      )),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du transfert Mobile Money');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // SCAN & PAY
  // ============================================================

  scanAndPay(data: { receiverQrCode: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/scan-pay`, data).pipe(
      tap(() => this.notificationService.showSuccess('Paiement effectué avec succès')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: 'Dépôt',
      withdrawal: 'Retrait',
      transfer: 'Transfert',
      payment: 'Paiement',
      mobile_money: 'Mobile Money',
      receive: 'Réception',
      send: 'Envoi',
      admin_withdrawal: 'Retrait Admin',
      admin_deposit: 'Dépôt Admin'
    };
    return labels[type] || type;
  }

  getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      deposit: 'success',
      withdrawal: 'danger',
      transfer: 'info',
      payment: 'warning',
      mobile_money: 'primary',
      receive: 'success',
      send: 'danger',
      admin_withdrawal: 'danger',
      admin_deposit: 'success'
    };
    return colors[type] || 'secondary';
  }

  getTransactionTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      deposit: 'arrow_downward',
      withdrawal: 'arrow_upward',
      transfer: 'swap_horiz',
      payment: 'payment',
      mobile_money: 'phone_android',
      receive: 'download',
      send: 'upload',
      admin_withdrawal: 'arrow_upward',
      admin_deposit: 'arrow_downward'
    };
    return icons[type] || 'receipt';
  }
}