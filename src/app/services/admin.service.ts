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

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http
      .get<AdminDashboardStats>(`${this.apiUrl}/dashboard/stats`, { headers: this.getHeaders() })
      .pipe(
        tap((data) => console.log('Stats admin reçues:', data)),
        catchError((error) => {
          if (error.status === 401) this.authService.logout();
          this.notificationService.showError('Erreur chargement stats');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // UTILISATEURS
  // ============================================================
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return throwError(() => error);
      }),
    );
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/users/${userId}/status`, { isActive }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'}`)),
        catchError((error) => {
          this.notificationService.showError('Erreur lors de la mise à jour');
          return throwError(() => error);
        }),
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError((error) => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      }),
    );
  }

  // ============================================================
  // ADMIN ACTIONS - DÉPÔT
  // ============================================================
  depositMoney(userId: string, amount: number, description?: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/users/${userId}/deposit`, { amount, description }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Dépôt de ${amount} Ar effectué`)),
        catchError((error) => {
          this.notificationService.showError('Erreur lors du dépôt');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // ADMIN ACTIONS - RETRAIT
  // ============================================================
  withdrawMoney(userId: string, amount: number, description?: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/users/${userId}/withdraw`, { amount, description }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Retrait de ${amount} Ar effectué`)),
        catchError((error) => {
          this.notificationService.showError('Erreur lors du retrait');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // ADMINISTRATEURS
  // ============================================================
  createAdmin(adminData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admins`, adminData, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Administrateur créé avec succès')),
      catchError((error) => {
        this.notificationService.showError('Erreur lors de la création');
        return throwError(() => error);
      }),
    );
  }

  getAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admins`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des administrateurs');
        return throwError(() => error);
      }),
    );
  }

  deleteAdmin(adminId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admins/${adminId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Administrateur supprimé')),
      catchError((error) => {
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      }),
    );
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================
  getAllTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return throwError(() => error);
      }),
    );
  }

  // ============================================================
  // PARAMÈTRES
  // ============================================================
  getSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/settings`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        this.notificationService.showError('Erreur lors du chargement des paramètres');
        return throwError(() => error);
      }),
    );
  }

  updateSettings(settings: SystemSettings): Observable<SystemSettings> {
    return this.http
      .patch<SystemSettings>(`${this.apiUrl}/settings`, settings, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess('Paramètres sauvegardés')),
        catchError((error) => {
          this.notificationService.showError('Erreur lors de la sauvegarde');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // SYSTÈME
  // ============================================================
  getSystemLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/system/logs`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Erreur logs:', error);
        return throwError(() => error);
      }),
    );
  }

  getSystemStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/system/stats`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Erreur stats système:', error);
        return throwError(() => error);
      }),
    );
  }

  updateAdminProfile(profileData: any): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/profile`, profileData, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          this.notificationService.showSuccess('Profil administrateur mis à jour');
        }),
        catchError((error) => {
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          return throwError(() => error);
        }),
      );
  }
}