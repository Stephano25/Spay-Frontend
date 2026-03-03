import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: any[];
  recentTransactions: any[];
  dailyStats: {
    date: string;
    users: number;
    transactions: number;
    volume: number;
  }[];
  topUsers: {
    userId: string;
    name: string;
    transactionCount: number;
    totalVolume: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Récupérer les statistiques pour le dashboard admin - DONNÉES RÉELLES UNIQUEMENT
   */
  getDashboardStats(): Observable<AdminDashboardStats> {
    console.log('📡 Appel API admin vers:', `${this.apiUrl}/dashboard/stats`);
    
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(
      tap(data => {
        console.log('✅ Données admin reçues:', data);
      }),
      catchError(error => {
        console.error('❌ Erreur chargement stats admin:', error);
        
        if (error.status === 404) {
          this.notificationService.showError('L\'endpoint admin n\'existe pas sur le serveur');
        } else if (error.status === 401 || error.status === 403) {
          this.notificationService.showError('Non autorisé - Veuillez vous reconnecter');
          this.authService.logout();
        } else {
          this.notificationService.showError('Erreur lors du chargement des statistiques');
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer tous les utilisateurs
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      tap(data => {
        console.log('✅ Utilisateurs reçus:', data.length);
      }),
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer toutes les transactions
   */
  getAllTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`).pipe(
      tap(data => {
        console.log('✅ Transactions reçues:', data.length);
      }),
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour le statut d'un utilisateur
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/status`, { isActive }).pipe(
      tap(() => this.notificationService.showSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'}`)),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }
}