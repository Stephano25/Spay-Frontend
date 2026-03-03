import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { Transaction, DashboardStats } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  // Données simulées pour le développement
  private mockStats: DashboardStats = {
    totalBalance: 150000,
    totalTransactions: 25,
    lastThreeTransactions: [
      { 
        id: '1',
        senderId: 'user1',
        type: 'transfer',
        amount: 5000,
        status: 'completed',
        description: 'Paiement restaurant',
        createdAt: new Date(),
        sender: { firstName: 'Jean', lastName: 'Rakoto', email: 'jean@email.com', id: 'user1' }
      },
      { 
        id: '2',
        senderId: 'user2',
        receiverId: 'user1',
        type: 'transfer',
        amount: 10000,
        status: 'completed',
        description: 'Virement de Jean',
        createdAt: new Date(Date.now() - 86400000),
        sender: { firstName: 'Marie', lastName: 'Rabe', email: 'marie@email.com', id: 'user2' }
      },
      { 
        id: '3',
        senderId: 'user1',
        type: 'payment',
        amount: 3000,
        status: 'completed',
        description: 'Achat en ligne',
        createdAt: new Date(Date.now() - 172800000)
      }
    ],
    lastDeposit: { 
      id: 'dep1',
      senderId: 'system',
      receiverId: 'user1',
      type: 'deposit',
      amount: 50000,
      status: 'completed',
      description: 'Dépôt',
      createdAt: new Date(Date.now() - 259200000)
    },
    largestTransaction: { 
      id: 'large1',
      senderId: 'user2',
      receiverId: 'user1',
      type: 'transfer',
      amount: 75000,
      status: 'completed',
      description: 'Gros virement',
      createdAt: new Date(Date.now() - 345600000)
    },
    monthlyStats: [
      { month: '1/2026', sent: 50000, received: 30000, total: 80000 },
      { month: '2/2026', sent: 45000, received: 60000, total: 105000 },
      { month: '3/2026', sent: 70000, received: 45000, total: 115000 }
    ]
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getUserDashboardStats(): Observable<DashboardStats> {
    // Essayer l'API, sinon utiliser les données simulées
    return this.http.get<DashboardStats>(`${this.apiUrl}/user/stats`).pipe(
      catchError(error => {
        console.warn('API non disponible, utilisation des données simulées', error);
        return of(this.mockStats);
      })
    );
  }

  getUserTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/user`).pipe(
      catchError(error => {
        console.warn('API non disponible, utilisation des données simulées', error);
        return of(this.mockStats.lastThreeTransactions);
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
    return this.http.get<any>(`${environment.apiUrl}/users/qr/${qrCode}`).pipe(
      catchError(error => {
        this.notificationService.showError('QR Code invalide');
        return throwError(() => error);
      })
    );
  }
}