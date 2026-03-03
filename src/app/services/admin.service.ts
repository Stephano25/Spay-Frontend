import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User, UserStats } from '../models/user.model';
import { Transaction, TransactionStats } from '../models/transaction.model';
import { AdminDashboardStats } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Dashboard
  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  // Gestion des utilisateurs
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return throwError(() => error);
      })
    );
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement de l\'utilisateur');
        return throwError(() => error);
      })
    );
  }

  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur créé avec succès')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la création');
        return throwError(() => error);
      })
    );
  }

  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, userData).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur mis à jour')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}/status`, { isActive }).pipe(
      tap(() => this.notificationService.showSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'}`)),
      catchError(error => {
        this.notificationService.showError('Erreur lors du changement de statut');
        return throwError(() => error);
      })
    );
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/users/stats`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  // Gestion des transactions
  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  getTransactionById(transactionId: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${transactionId}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement de la transaction');
        return throwError(() => error);
      })
    );
  }

  updateTransactionStatus(transactionId: string, status: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/transactions/${transactionId}/status`, { status }).pipe(
      tap(() => this.notificationService.showSuccess('Statut mis à jour')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  getTransactionStats(): Observable<TransactionStats> {
    return this.http.get<TransactionStats>(`${this.apiUrl}/transactions/stats`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  // Statistiques avancées
  getDailyStats(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/daily?days=${days}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        return throwError(() => error);
      })
    );
  }

  getTopUsers(limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/top-users?limit=${limit}`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement du classement');
        return throwError(() => error);
      })
    );
  }

  // Paramètres système
  getSystemSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des paramètres');
        return throwError(() => error);
      })
    );
  }

  updateSystemSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings).pipe(
      tap(() => this.notificationService.showSuccess('Paramètres mis à jour')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  getAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/audit-logs`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des logs');
        return throwError(() => error);
      })
    );
  }
}