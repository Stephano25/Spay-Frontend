import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
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

export interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultUserRole: string;
    maxFileSize: number;
    sessionTimeout: number;
  };
  security: {
    twoFactorAuth: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecial: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
  };
  payment: {
    minTransaction: number;
    maxTransaction: number;
    dailyTransferLimit: number;
    monthlyTransferLimit: number;
    mobileMoneyEnabled: boolean;
    mobileMoneyOperators: {
      airtel: boolean;
      orange: boolean;
      mvola: boolean;
    };
    transferFees: {
      airtel: number;
      orange: number;
      mvola: number;
      internal: number;
    };
    currency: string;
  };
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

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDashboardStats(): Observable<AdminDashboardStats> {
    console.log('📡 Appel API admin vers:', `${this.apiUrl}/dashboard/stats`);
    
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/dashboard/stats`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => {
        console.log('✅ Données admin reçues:', data);
      }),
      catchError(error => {
        console.error('❌ Erreur chargement stats admin:', error);
        
        if (error.status === 401 || error.status === 403) {
          this.notificationService.showError('Non autorisé - Veuillez vous reconnecter');
          this.authService.logout();
        } else if (error.status === 404) {
          this.notificationService.showError('API non disponible');
        } else {
          this.notificationService.showError('Erreur lors du chargement des statistiques');
        }
        
        return throwError(() => error);
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return throwError(() => error);
      })
    );
  }

  getAllTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      })
    );
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/status`, 
      { isActive },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.notificationService.showSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'}`)),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      })
    );
  }

  getSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/settings`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur lors du chargement des paramètres');
        return throwError(() => error);
      })
    );
  }

  updateSettings(settings: SystemSettings): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(`${this.apiUrl}/settings`, settings, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.notificationService.showSuccess('Paramètres sauvegardés')),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la sauvegarde');
        return throwError(() => error);
      })
    );
  }

  getSystemLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/system/logs`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur logs:', error);
        return throwError(() => error);
      })
    );
  }

  getSystemStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/system/stats`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur stats système:', error);
        return throwError(() => error);
      })
    );
  }
}