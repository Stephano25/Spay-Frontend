// frontend/src/app/services/admin-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  balance: number;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: Date;
  sender?: User;
  receiver?: User;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return throwError(() => error);
      })
    );
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/admin/transactions`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/status`, { isActive }, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'}`)),
      catchError((error) => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError((error) => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }

  // ✅ AJOUTER CETTE MÉTHODE
  depositMoney(userId: string, amount: number, description?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/users/${userId}/deposit`,
      { amount, description },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.notificationService.showSuccess(`Dépôt de ${amount} Ar effectué`)),
      catchError((error) => {
        this.notificationService.showError('Erreur lors du dépôt');
        return throwError(() => error);
      })
    );
  }
}