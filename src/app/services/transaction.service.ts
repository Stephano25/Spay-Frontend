import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    // Simuler des données pour le test
    return new Observable(observer => {
      observer.next({
        totalBalance: 150000,
        totalTransactions: 25,
        lastDeposit: { amount: 50000 },
        largestTransaction: { amount: 75000 },
        lastThreeTransactions: [
          { type: 'sent', description: 'Paiement', amount: 5000, createdAt: new Date() },
          { type: 'received', description: 'Virement', amount: 10000, createdAt: new Date() },
          { type: 'sent', description: 'Achat', amount: 3000, createdAt: new Date() }
        ],
        monthlyStats: [
          { month: '1/2026', sent: 50000, received: 30000, total: 80000 }
        ]
      });
      observer.complete();
    });
  }

  getUserByQRCode(qrCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/qr/${qrCode}`);
  }

  scanAndPay(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/scan-pay`, data);
  }

  mobileMoneyTransfer(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/mobile-money`, data);
  }

  getTransactions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions`);
  }

  sendMoney(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/send`, data);
  }
}