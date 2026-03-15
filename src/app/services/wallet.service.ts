import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap, map, shareReplay } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  Wallet, 
  WalletStats, 
  Transaction, 
  SendMoneyRequest, 
  MobileMoneyRequest, 
  ScanPayRequest, 
  QRCodeResponse 
} from '../models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;
  private walletCache$: Observable<Wallet> | null = null;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    console.log('📡 WalletService API URL:', this.apiUrl);
  }

  /**
   * Récupérer l'ID de l'utilisateur connecté
   */
  getCurrentUserId(): string {
    const user = this.authService.getCurrentUser();
    return user?.id || '';
  }

  /**
   * Récupérer les informations du portefeuille (avec cache optionnel)
   */
  getWallet(forceRefresh: boolean = false): Observable<Wallet> {
    console.log('📡 Appel API getWallet vers:', `${this.apiUrl}/me`);
    
    // Si on force le rafraîchissement, on vide le cache
    if (forceRefresh) {
      this.walletCache$ = null;
    }
    
    // Utiliser le cache si disponible
    if (!this.walletCache$) {
      this.walletCache$ = this.http.get<Wallet>(`${this.apiUrl}/me`).pipe(
        tap(wallet => {
          console.log('✅ Wallet reçu (base de données):', wallet);
        }),
        shareReplay(1), // Met en cache la dernière valeur
        catchError(error => {
          console.error('❌ Erreur getWallet:', error);
          this.notificationService.showError('Erreur lors du chargement du portefeuille');
          this.walletCache$ = null;
          return throwError(() => error);
        })
      );
    }
    
    return this.walletCache$;
  }

  /**
   * Récupérer les statistiques du portefeuille
   */
  getWalletStats(): Observable<WalletStats> {
    console.log('📡 Appel API getWalletStats vers:', `${this.apiUrl}/stats`);
    
    return this.http.get<WalletStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => {
        console.log('✅ Statistiques reçues:', stats);
      }),
      catchError(error => {
        console.error('❌ Erreur getWalletStats:', error);
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer l'historique des transactions
   */
  getTransactions(page: number = 1, limit: number = 20): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, {
      params: { page: page.toString(), limit: limit.toString() }
    }).pipe(
      tap(transactions => {
        console.log(`✅ ${transactions.length} transactions reçues`);
      }),
      catchError(error => {
        console.error('❌ Erreur getTransactions:', error);
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Envoyer de l'argent à un autre utilisateur
   */
  sendMoney(data: SendMoneyRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/send`, data).pipe(
      tap(transaction => {
        this.notificationService.showSuccess(
          `Envoi de ${this.formatAmount(data.amount)} Ar réussi !`
        );
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de l\'envoi');
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier le solde
   */
  checkBalance(): Observable<number> {
    return this.http.get<{balance: number}>(`${this.apiUrl}/balance`).pipe(
      tap(response => {
        console.log('✅ Solde reçu:', response.balance);
      }),
      map(response => response.balance),
      catchError(error => {
        console.error('❌ Erreur checkBalance:', error);
        this.notificationService.showError('Erreur lors de la vérification du solde');
        return throwError(() => error);
      })
    );
  }

  /**
   * Générer un QR code pour recevoir de l'argent
   */
  generateReceiveQRCode(amount?: number): Observable<QRCodeResponse> {
    return this.http.post<QRCodeResponse>(`${this.apiUrl}/generate-qr`, { amount }).pipe(
      tap(response => {
        console.log('✅ QR code généré:', response.qrCode);
      }),
      catchError(error => {
        console.error('❌ Erreur generateQRCode:', error);
        this.notificationService.showError('Erreur lors de la génération du QR code');
        return throwError(() => error);
      })
    );
  }

  /**
   * Formater le montant
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }
}

// Exporter les types pour qu'ils soient accessibles depuis le service
export type { 
  Wallet, 
  WalletStats, 
  Transaction, 
  SendMoneyRequest, 
  MobileMoneyRequest, 
  ScanPayRequest, 
  QRCodeResponse 
};