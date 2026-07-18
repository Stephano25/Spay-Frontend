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
  // ENVOI D'ARGENT (avec commission 5%)
  // ============================================================
  sendMoney(data: { receiverId: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/send`, data).pipe(
      tap(() => {
        this.notificationService.showSuccess('Argent envoyé avec succès');
      }),
      catchError((error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de l\'envoi');
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