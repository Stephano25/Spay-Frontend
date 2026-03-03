import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Transaction, DashboardStats } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Récupérer les statistiques du dashboard - DONNÉES RÉELLES UNIQUEMENT
   */
  getUserDashboardStats(): Observable<DashboardStats> {
    console.log('📡 Appel API vers:', `${this.apiUrl}/user/stats`);
    
    return this.http.get<DashboardStats>(`${this.apiUrl}/user/stats`).pipe(
      tap(data => {
        console.log('✅ Données reçues:', data);
      }),
      catchError(error => {
        console.error('❌ Erreur API:', error);
        
        if (error.status === 401) {
          this.notificationService.showError('Session expirée, veuillez vous reconnecter');
          // this.authService.logout();
        } else {
          this.notificationService.showError('Erreur lors du chargement des statistiques');
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les transactions de l'utilisateur
   */
  getUserTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/user`).pipe(
      tap(data => {
        console.log('✅ Transactions reçues:', data.length);
      }),
      catchError(error => {
        console.error('❌ Erreur chargement transactions:', error);
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Envoyer de l'argent
   */
  sendMoney(data: { receiverId: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/send`, data).pipe(
      tap(() => this.notificationService.showSuccess('Argent envoyé avec succès')),
      catchError(error => {
        if (error.status === 401) {
          this.notificationService.showError('Session expirée, veuillez vous reconnecter');
          this.authService.logout();
        } else {
          this.notificationService.showError(error.error?.message || "Erreur lors de l'envoi");
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Paiement par scan
   */
  scanAndPay(data: { receiverQrCode: string; amount: number; description?: string }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/scan-pay`, data).pipe(
      tap(() => this.notificationService.showSuccess('Paiement effectué avec succès')),
      catchError(error => {
        if (error.status === 401) {
          this.authService.logout();
        } else {
          this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Transfert Mobile Money
   */
  mobileMoneyTransfer(data: { operator: string; phoneNumber: string; amount: number }): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/mobile-money`, data).pipe(
      tap(() => this.notificationService.showSuccess('Transfert Mobile Money effectué')),
      catchError(error => {
        if (error.status === 401) {
          this.authService.logout();
        } else {
          this.notificationService.showError(error.error?.message || 'Erreur lors du transfert');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer un utilisateur par QR code
   */
  getUserByQRCode(qrCode: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/qr/${qrCode}`);
  }

  /**
   * Formater le montant
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  }
}