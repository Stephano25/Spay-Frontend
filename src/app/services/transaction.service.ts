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

  constructor(private http: HttpClient, private notificationService: NotificationService, private authService: AuthService) {}

  getUserDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/user/stats`).pipe(
      tap(data => console.log('Stats user:', data)),
      catchError(error => { this.notificationService.showError('Erreur chargement stats'); return throwError(() => error); })
    );
  }

  sendMoney(data: { receiverId: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/send`, data).pipe(
      tap(() => this.notificationService.showSuccess('Argent envoyé avec succès')),
      catchError(error => { this.notificationService.showError(error.error?.message || "Erreur envoi"); return throwError(() => error); })
    );
  }

  mobileMoneyTransfer(data: { operator: string; phoneNumber: string; amount: number }): Observable<Transaction> {
    const cleanData = { operator: data.operator, phoneNumber: data.phoneNumber.replace(/\s/g, ''), amount: Number(data.amount) };
    return this.http.post<Transaction>(`${this.apiUrl}/mobile-money`, cleanData).pipe(
      tap(() => this.notificationService.showSuccess(`Transfert Mobile Money de ${data.amount} Ar vers ${data.operator} effectué !`)),
      catchError(error => { this.notificationService.showError(error.error?.message || 'Erreur transfert'); return throwError(() => error); })
    );
  }

  scanAndPay(data: { receiverQrCode: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/scan-pay`, data).pipe(
      tap(() => this.notificationService.showSuccess('Paiement effectué')),
      catchError(error => { this.notificationService.showError(error.error?.message || 'Erreur paiement'); return throwError(() => error); })
    );
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
  // transaction.service.ts (extrait ajouté)
  // Dans la classe TransactionService, ajoutez :
  getTransactions(page: number = 1, limit: number = 50): Observable<{ transactions: Transaction[], total: number }> {
    return this.http.get<{ transactions: Transaction[], total: number }>(`${this.apiUrl}`, { params: { page, limit } }).pipe(
      tap(data => console.log('Transactions chargées:', data.transactions.length)),
      catchError(error => { this.notificationService.showError('Erreur chargement des transactions'); return throwError(() => error); })
    );
  }

  // Dans transaction.service.ts
  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/all`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur chargement des transactions');
        return throwError(() => error);
      })
    );
  }
}