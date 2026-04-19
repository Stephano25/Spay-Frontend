import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TransferData {
  receiverId: string;
  amount: number;
  description?: string;
}

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

export interface WalletStats {
  balance: number;
  totalBalance: number;
  totalReceived: number;
  totalSent: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  totalFees: number;
  pendingBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  todaySpent: number;
  monthSpent: number;
  remainingDailyLimit: number;
  remainingMonthlyLimit: number;
  recentTransactions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}/me`);
  }

  getBalance(): Observable<{ balance: number; currency: string }> {
    return this.http.get<{ balance: number; currency: string }>(`${this.apiUrl}/balance`);
  }

  checkBalance(): Observable<number> {
    return this.getBalance().pipe(map(res => res.balance));
  }

  getWalletStats(): Observable<WalletStats> {
    return this.http.get<WalletStats>(`${this.apiUrl}/me`);
  }

  transferMoney(data: TransferData): Observable<any> {
    return this.http.post(`${this.apiUrl}/transfer`, data);
  }

  sendMoney(data: TransferData): Observable<any> {
    return this.transferMoney(data);
  }

  deposit(amount: number, paymentMethod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/deposit`, { amount, paymentMethod });
  }

  withdraw(amount: number, paymentMethod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdraw`, { amount, paymentMethod });
  }

  syncWallet(): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync`, {});
  }

  generateReceiveQRCode(amount?: number): Observable<{ qrCode: string; expiresAt: Date }> {
    const body = amount ? { amount } : {};
    return this.http.post<{ qrCode: string; expiresAt: Date }>(`${this.apiUrl}/generate-qr`, body);
  }
}