import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap, map } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

// EXPORTER TOUTES LES INTERFACES
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  qrCode: string;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money';
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  senderId?: string;
  receiverId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  mobileMoneyOperator?: 'airtel' | 'orange' | 'mvola';
  mobileMoneyNumber?: string;
  paymentMethod?: 'wallet' | 'mobile_money' | 'bank_card';
  metadata?: any;
  createdAt: Date;
  updatedAt?: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WalletStats {
  totalBalance: number;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfers: number;
  monthlyStats: {
    month: string;
    deposits: number;
    withdrawals: number;
    transfers: number;
    total: number;
  }[];
  recentTransactions: Transaction[];
}

export interface SendMoneyRequest {
  receiverId: string;
  amount: number;
  description?: string;
  pin?: string;
}

export interface MobileMoneyRequest {
  operator: 'airtel' | 'orange' | 'mvola';
  phoneNumber: string;
  amount: number;
  pin?: string;
}

export interface ScanPayRequest {
  receiverQrCode: string;
  amount: number;
  description?: string;
  pin?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    console.log('📡 WalletService API URL:', this.apiUrl);
  }

  /**
   * Récupérer les informations du portefeuille
   */
  getWallet(): Observable<Wallet> {
    console.log('📡 Appel API getWallet vers:', `${this.apiUrl}/me`);
    
    return this.http.get<Wallet>(`${this.apiUrl}/me`).pipe(
      tap(wallet => {
        console.log('✅ Wallet reçu:', wallet);
      }),
      catchError(error => {
        console.error('❌ Erreur getWallet:', error);
        this.notificationService.showError('Erreur lors du chargement du portefeuille');
        return throwError(() => error);
      })
    );
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
   * Récupérer une transaction par son ID
   */
  getTransactionById(transactionId: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${transactionId}`).pipe(
      tap(transaction => {
        console.log('✅ Transaction reçue:', transaction.id);
      }),
      catchError(error => {
        console.error('❌ Erreur getTransactionById:', error);
        this.notificationService.showError('Erreur lors du chargement de la transaction');
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
   * Payer par scan QR code
   */
  scanAndPay(data: ScanPayRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/scan-pay`, data).pipe(
      tap(transaction => {
        this.notificationService.showSuccess(
          `Paiement de ${this.formatAmount(data.amount)} Ar effectué !`
        );
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du paiement');
        return throwError(() => error);
      })
    );
  }

  /**
   * Transférer vers Mobile Money
   */
  mobileMoneyTransfer(data: MobileMoneyRequest): Observable<Transaction> {
    const operatorNames: Record<string, string> = {
      airtel: 'Airtel Money',
      orange: 'Orange Money',
      mvola: 'MVola'
    };
    
    return this.http.post<Transaction>(`${this.apiUrl}/mobile-money`, data).pipe(
      tap(transaction => {
        this.notificationService.showSuccess(
          `Transfert de ${this.formatAmount(data.amount)} Ar vers ${operatorNames[data.operator]} effectué !`
        );
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du transfert');
        return throwError(() => error);
      })
    );
  }

  /**
   * Déposer de l'argent
   */
  deposit(amount: number, paymentMethod: 'wallet' | 'mobile_money' | 'bank_card'): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/deposit`, { amount, paymentMethod }).pipe(
      tap(transaction => {
        this.notificationService.showSuccess(
          `Dépôt de ${this.formatAmount(amount)} Ar effectué !`
        );
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du dépôt');
        return throwError(() => error);
      })
    );
  }

  /**
   * Retirer de l'argent
   */
  withdraw(amount: number, paymentMethod: 'wallet' | 'mobile_money' | 'bank_card'): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/withdraw`, { amount, paymentMethod }).pipe(
      tap(transaction => {
        this.notificationService.showSuccess(
          `Retrait de ${this.formatAmount(amount)} Ar effectué !`
        );
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du retrait');
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
      map(response => response.balance), // ← AJOUTER CETTE LIGNE pour extraire la valeur
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