// frontend/src/app/services/wallet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Wallet, WalletStats, SendMoneyRequest, MobileMoneyRequest, ScanPayRequest, QRCodeResponse } from '../models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère le wallet complet
   */
  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}`);
  }

  /**
   * Récupère uniquement le solde
   */
  getBalance(): Observable<{ balance: number; currency: string }> {
    return this.http.get<{ balance: number; currency: string }>(`${this.apiUrl}/balance`);
  }

  /**
   * Vérifie le solde (retourne un nombre)
   */
  checkBalance(): Observable<number> {
    return this.getBalance().pipe(
      map(res => res.balance || 0)
    );
  }

  /**
   * Récupère les statistiques du wallet
   */
  getWalletStats(): Observable<WalletStats> {
    return this.http.get<WalletStats>(`${this.apiUrl}`);
  }

  /**
   * Envoie de l'argent à un autre utilisateur
   */
  transferMoney(data: SendMoneyRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-money`, data);
  }

  /**
   * Alias de transferMoney
   */
  sendMoney(data: SendMoneyRequest): Observable<any> {
    return this.transferMoney(data);
  }

  /**
   * Dépôt d'argent
   */
  deposit(amount: number, paymentMethod: string = 'bank_card'): Observable<any> {
    return this.http.post(`${this.apiUrl}/deposit`, { amount, paymentMethod });
  }

  /**
   * Retrait d'argent
   */
  withdraw(amount: number, paymentMethod: string = 'bank_card'): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdraw`, { amount, paymentMethod });
  }

  /**
   * Synchronise le wallet avec le solde utilisateur
   */
  syncWallet(): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync`, {});
  }

  /**
   * Génère un QR code pour recevoir de l'argent
   */
  generateReceiveQRCode(amount?: number): Observable<QRCodeResponse> {
    const body = amount ? { amount } : {};
    return this.http.post<QRCodeResponse>(`${this.apiUrl}/generate-qr`, body);
  }

  /**
   * Scanne un QR code
   */
  scanQRCode(qrData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/scan-qr`, { qrData });
  }
}