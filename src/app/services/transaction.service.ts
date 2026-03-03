import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

export interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: Date;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  lastThreeTransactions: Transaction[];
  lastDeposit?: Transaction;
  largestTransaction?: Transaction;
  monthlyStats: {
    month: string;
    sent: number;
    received: number;
    total: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getUserDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/user/stats`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  getUserTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/user`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  sendMoney(data: { receiverId: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/send`, data).pipe(
      tap(() => this.notificationService.showSuccess('Argent envoyé avec succès')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || "Erreur lors de l'envoi");
        return throwError(() => error);
      })
    );
  }

  scanAndPay(data: { receiverQrCode: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/scan-pay`, data).pipe(
      tap(() => this.notificationService.showSuccess('Paiement effectué avec succès')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        return throwError(() => error);
      })
    );
  }

  mobileMoneyTransfer(data: { operator: string; phoneNumber: string; amount: number }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/mobile-money`, data).pipe(
      tap(() => this.notificationService.showSuccess('Transfert Mobile Money effectué')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du transfert');
        return throwError(() => error);
      })
    );
  }

  getUserByQRCode(qrCode: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/qr/${qrCode}`);
  }
}