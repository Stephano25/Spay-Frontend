// frontend/src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Commission, CommissionStats } from '../models/transaction.model';

export interface DailyStat {
  date: string;
  users: number;
  transactions: number;
  volume: number;
}

export interface TopUser {
  userId: string;
  name: string;
  transactionCount: number;
  totalVolume: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: any[];
  recentTransactions: any[];
  dailyStats: DailyStat[];
  topUsers: TopUser[];
  totalAdmins?: number;
  totalSuperAdmins?: number;
  adminTransactions?: number;
  adminVolume?: number;
  myAdminTransactions?: number;
  myAdminVolume?: number;
  userRole?: string;
  totalSuperAdminCommission?: number;
  totalAdminCommission?: number;
  totalCommissionTransactions?: number;
  recentCommissions?: Commission[];
  commissionRate?: number;
  myCommission?: number;
  myCommissionTransactions?: number;
  adminCommissions?: CommissionStats['adminCommissions'];
}

export interface QRCodeResponse {
  qrCode: string;
  qrCodeImage: string;
  expiresAt: string;
  action: 'deposit' | 'withdraw';
  amount: number | null;
}

export interface QRScanResult {
  valid: boolean;
  action: 'deposit' | 'withdraw';
  adminId: string;
  adminName: string;
  amount: number | null;
  qrCode?: string;
  expiresAt?: string;
  isAdminTransaction?: boolean;
  type?: string;
  timestamp?: string;
  signature?: string;
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
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    });
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  getDashboardStats(): Observable<AdminDashboardStats> {
    console.log('🔍 Appel API /admin/dashboard/stats');
    return this.http
      .get<any>(`${this.apiUrl}/dashboard/stats`, { headers: this.getHeaders() })
      .pipe(
        map((response) => {
          console.log('📊 Réponse brute du backend:', JSON.stringify(response, null, 2));
          
          if (Array.isArray(response)) {
            console.log('⚠️ La réponse est un tableau, conversion...');
            return {
              totalUsers: response.length || 0,
              activeUsers: response.filter((u: any) => u.isActive !== false).length || 0,
              totalTransactions: 0,
              totalVolume: 0,
              recentUsers: response.slice(0, 5),
              recentTransactions: [],
              dailyStats: [],
              topUsers: [],
              totalAdmins: response.filter((u: any) => u.role === 'admin' || u.role === 'super_admin').length || 0,
              totalSuperAdmins: response.filter((u: any) => u.role === 'super_admin').length || 0,
              adminTransactions: 0,
              adminVolume: 0,
              myAdminTransactions: 0,
              myAdminVolume: 0,
              userRole: 'admin',
              totalSuperAdminCommission: 0,
              totalAdminCommission: 0,
              totalCommissionTransactions: 0,
              recentCommissions: [],
              commissionRate: 0.5,
              myCommission: 0,
              myCommissionTransactions: 0,
              adminCommissions: [],
            };
          }
          
          let data = response;
          if (response && response.data) {
            data = response.data;
          }
          if (response && response.stats) {
            data = response.stats;
          }
          if (response && response.result) {
            data = response.result;
          }
          if (response && response.users) {
            data = response;
          }
          
          const stats: AdminDashboardStats = {
            totalUsers: this.safeGet(data, 'totalUsers', 0),
            activeUsers: this.safeGet(data, 'activeUsers', 0),
            totalTransactions: this.safeGet(data, 'totalTransactions', 0),
            totalVolume: this.safeGet(data, 'totalVolume', 0),
            recentUsers: this.safeGet(data, 'recentUsers', []),
            recentTransactions: this.safeGet(data, 'recentTransactions', []),
            dailyStats: this.safeGet(data, 'dailyStats', []),
            topUsers: this.safeGet(data, 'topUsers', []),
            totalAdmins: this.safeGet(data, 'totalAdmins', 0),
            totalSuperAdmins: this.safeGet(data, 'totalSuperAdmins', 0),
            adminTransactions: this.safeGet(data, 'adminTransactions', 0),
            adminVolume: this.safeGet(data, 'adminVolume', 0),
            myAdminTransactions: this.safeGet(data, 'myAdminTransactions', 0),
            myAdminVolume: this.safeGet(data, 'myAdminVolume', 0),
            userRole: this.safeGet(data, 'userRole', 'admin'),
            totalSuperAdminCommission: this.safeGet(data, 'totalSuperAdminCommission', 0),
            totalAdminCommission: this.safeGet(data, 'totalAdminCommission', 0),
            totalCommissionTransactions: this.safeGet(data, 'totalCommissionTransactions', 0),
            recentCommissions: this.safeGet(data, 'recentCommissions', []),
            commissionRate: this.safeGet(data, 'commissionRate', 0.5),
            myCommission: this.safeGet(data, 'myCommission', 0),
            myCommissionTransactions: this.safeGet(data, 'myCommissionTransactions', 0),
            adminCommissions: this.safeGet(data, 'adminCommissions', []),
          };
          
          console.log('✅ Stats finales construites:', JSON.stringify(stats, null, 2));
          return stats;
        }),
        tap((data) => {
          console.log('📊 Stats finales après parsing:', data);
        }),
        catchError((error) => {
          console.error('❌ Erreur getDashboardStats:', error);
          if (error.status === 401) {
            this.authService.logout();
          }
          this.notificationService.showError('Erreur chargement des statistiques');
          return of({
            totalUsers: 0,
            activeUsers: 0,
            totalTransactions: 0,
            totalVolume: 0,
            recentUsers: [],
            recentTransactions: [],
            dailyStats: [],
            topUsers: [],
            totalAdmins: 0,
            totalSuperAdmins: 0,
            adminTransactions: 0,
            adminVolume: 0,
            myAdminTransactions: 0,
            myAdminVolume: 0,
            userRole: 'admin',
            totalSuperAdminCommission: 0,
            totalAdminCommission: 0,
            totalCommissionTransactions: 0,
            recentCommissions: [],
            commissionRate: 0.5,
            myCommission: 0,
            myCommissionTransactions: 0,
            adminCommissions: [],
          });
        }),
      );
  }

  private safeGet<T>(obj: any, key: string, defaultValue: T): T {
    if (!obj) return defaultValue;
    const value = obj[key];
    return value !== undefined && value !== null ? value : defaultValue;
  }

  // ============================================================
  // COMMISSIONS
  // ============================================================
  getCommissionStats(): Observable<CommissionStats> {
    console.log('💰 Appel API /admin/dashboard/commissions');
    return this.http
      .get<any>(`${this.apiUrl}/dashboard/commissions`, { headers: this.getHeaders() })
      .pipe(
        map((response) => {
          console.log('💰 Réponse brute commissions:', JSON.stringify(response, null, 2));
          
          let data = response;
          if (response && response.data) {
            data = response.data;
          }
          if (response && response.result) {
            data = response.result;
          }
          
          const stats: CommissionStats = {
            totalSuperAdminCommission: this.safeGet(data, 'totalSuperAdminCommission', 0),
            totalAdminCommission: this.safeGet(data, 'totalAdminCommission', 0),
            totalCommissionTransactions: this.safeGet(data, 'totalCommissionTransactions', 0),
            recentCommissions: this.safeGet(data, 'recentCommissions', []),
            adminCommissions: this.safeGet(data, 'adminCommissions', []),
            superAdminTotalCommission: this.safeGet(data, 'superAdminTotalCommission', 0),
            myCommission: this.safeGet(data, 'myCommission', 0),
            myCommissionTransactions: this.safeGet(data, 'myCommissionTransactions', 0),
            commissionRate: this.safeGet(data, 'commissionRate', 0.5),
            userRole: this.safeGet(data, 'userRole', 'admin')
          };
          
          console.log('💰 Statistiques commissions parsées:', stats);
          return stats;
        }),
        tap((data) => console.log('💰 Commissions finales:', data)),
        catchError((error) => {
          console.warn('⚠️ Commission stats non disponibles (peut-être 404)');
          return of({
            totalSuperAdminCommission: 0,
            totalAdminCommission: 0,
            totalCommissionTransactions: 0,
            recentCommissions: [],
            adminCommissions: [],
            superAdminTotalCommission: 0,
            myCommission: 0,
            myCommissionTransactions: 0,
            commissionRate: 0.5,
            userRole: 'admin'
          });
        }),
      );
  }

  // ============================================================
  // UTILISATEURS
  // ============================================================
  getAllUsers(): Observable<User[]> {
    console.log('🔍 Appel de getAllUsers()');
    
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() }).pipe(
      map((response: any) => {
        console.log('📥 Réponse brute:', response);
        
        let users: User[] = [];
        
        if (Array.isArray(response)) {
          console.log('✅ Cas 1: Tableau direct');
          users = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          console.log('✅ Cas 2: { data: [...] }');
          users = response.data;
        } else if (response && response.users && Array.isArray(response.users)) {
          console.log('✅ Cas 3: { users: [...] }');
          users = response.users;
        } else if (response && response.results && Array.isArray(response.results)) {
          console.log('✅ Cas 4: { results: [...] }');
          users = response.results;
        } else if (response && typeof response === 'object') {
          console.log('✅ Cas 5: Conversion d\'objet en tableau');
          const possibleUsers = Object.values(response).filter(item => 
            item && typeof item === 'object' && 
            'id' in item && 
            'email' in item &&
            'firstName' in item
          );
          
          if (possibleUsers.length > 0) {
            users = possibleUsers as User[];
            console.log(`✅ ${users.length} utilisateurs trouvés dans l'objet`);
          }
        }
        
        console.log(`👥 ${users?.length || 0} utilisateurs extraits`);
        return users;
      }),
      tap((users) => {
        console.log(`✅ Service: ${users?.length || 0} utilisateurs retournés`);
      }),
      catchError((error) => {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        return of([]);
      }),
    );
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('❌ Erreur chargement utilisateur:', error);
        this.notificationService.showError('Erreur lors du chargement de l\'utilisateur');
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
          console.error('❌ Erreur mise à jour statut:', error);
          this.notificationService.showError('Erreur lors de la mise à jour');
          return throwError(() => error);
        }),
      );
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/users/${userId}/role`, { role }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Rôle utilisateur mis à jour`)),
        catchError((error) => {
          console.error('❌ Erreur mise à jour rôle:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du rôle');
          return throwError(() => error);
        }),
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Utilisateur supprimé')),
      catchError((error) => {
        console.error('❌ Erreur suppression:', error);
        this.notificationService.showError('Erreur lors de la suppression');
        return throwError(() => error);
      }),
    );
  }

  // ============================================================
  // ADMIN ACTIONS - DÉPÔT
  // ============================================================
  depositMoney(userId: string, amount: number, description?: string, qrCode?: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/users/${userId}/deposit`, { amount, description, qrCode }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Dépôt de ${amount} Ar effectué`)),
        catchError((error) => {
          console.error('❌ Erreur dépôt:', error);
          this.notificationService.showError(error.error?.message || 'Erreur lors du dépôt');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // ADMIN ACTIONS - RETRAIT
  // ============================================================
  withdrawMoney(userId: string, amount: number, description?: string, qrCode?: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/users/${userId}/withdraw`, { amount, description, qrCode }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess(`Retrait de ${amount} Ar effectué`)),
        catchError((error) => {
          console.error('❌ Erreur retrait:', error);
          this.notificationService.showError(error.error?.message || 'Erreur lors du retrait');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // QR CODE
  // ============================================================
  generateQRCode(type: 'deposit' | 'withdraw', amount?: number): Observable<QRCodeResponse> {
    console.log(`🔍 Génération QR Code: type=${type}, amount=${amount}`);
    return this.http
      .post<QRCodeResponse>(`${this.apiUrl}/generate-qr`, { type, amount }, { headers: this.getHeaders() })
      .pipe(
        tap((response) => console.log('✅ QR Code généré:', response)),
        catchError((error) => {
          console.error('❌ Erreur génération QR Code:', error);
          this.notificationService.showError('Erreur lors de la génération du QR Code');
          return throwError(() => error);
        }),
      );
  }

  scanQRCode(qrData: string): Observable<QRScanResult> {
    console.log('🔍 Scan QR Code:', qrData);
    return this.http
      .post<QRScanResult>(`${this.apiUrl}/scan-qr`, { qrData }, { headers: this.getHeaders() })
      .pipe(
        tap((response) => console.log('✅ QR Code scanné:', response)),
        catchError((error) => {
          console.error('❌ Erreur scan QR Code:', error);
          this.notificationService.showError(error.error?.message || 'QR Code invalide');
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
        console.error('❌ Erreur création admin:', error);
        this.notificationService.showError(error.error?.message || 'Erreur lors de la création');
        return throwError(() => error);
      }),
    );
  }

  getAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admins`, { headers: this.getHeaders() }).pipe(
      tap((admins) => console.log(`👥 ${admins?.length || 0} administrateurs chargés`)),
      catchError((error) => {
        console.error('❌ Erreur chargement admins:', error);
        this.notificationService.showError('Erreur lors du chargement des administrateurs');
        return of([]);
      }),
    );
  }

  deleteAdmin(adminId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admins/${adminId}`, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Administrateur supprimé')),
      catchError((error) => {
        console.error('❌ Erreur suppression admin:', error);
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
      tap((txs) => console.log(`📋 ${txs?.length || 0} transactions chargées`)),
      catchError((error) => {
        console.error('❌ Erreur chargement transactions:', error);
        this.notificationService.showError('Erreur lors du chargement des transactions');
        return of([]);
      }),
    );
  }

  getTransactionById(transactionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions/${transactionId}`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('❌ Erreur chargement transaction:', error);
        this.notificationService.showError('Erreur lors du chargement de la transaction');
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
        console.error('❌ Erreur chargement settings:', error);
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
          console.error('❌ Erreur sauvegarde settings:', error);
          this.notificationService.showError('Erreur lors de la sauvegarde');
          return throwError(() => error);
        }),
      );
  }

  // ============================================================
  // SYSTÈME
  // ============================================================
  getSystemLogs(): Observable<any[]> {
    console.log('📋 Récupération des logs système...');
    return this.http.get<any[]>(`${this.apiUrl}/system/logs`, { headers: this.getHeaders() }).pipe(
      tap((logs) => console.log(`📋 ${logs?.length || 0} logs récupérés`)),
      catchError((error) => {
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /admin/system/logs non trouvé - utilisation de données simulées');
          return of([]);
        }
        console.error('❌ Erreur logs:', error);
        return of([]);
      }),
    );
  }

  getSystemStats(): Observable<any> {
    console.log('📊 Récupération des statistiques système...');
    return this.http.get<any>(`${this.apiUrl}/system/stats`, { headers: this.getHeaders() }).pipe(
      tap((stats) => console.log('📊 Statistiques système récupérées:', stats)),
      catchError((error) => {
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /admin/system/stats non trouvé - utilisation de données simulées');
          return of({
            uptime: '1j 5h',
            memoryUsage: '128 MB',
            cpuUsage: '12%',
            diskUsage: '45%',
            databaseSize: '24 MB',
            activeUsers: 0,
            activeSessions: 0,
            apiCalls: 0
          });
        }
        console.error('❌ Erreur stats système:', error);
        return of({
          uptime: 'Chargement...',
          memoryUsage: '0%',
          cpuUsage: '0%',
          diskUsage: '0%',
          databaseSize: '0 MB',
          activeUsers: 0,
          activeSessions: 0,
          apiCalls: 0
        });
      }),
    );
  }

  // ============================================================
  // PROFIL ADMIN
  // ============================================================
  getAdminProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('❌ Erreur chargement profil:', error);
        this.notificationService.showError('Erreur lors du chargement du profil');
        return throwError(() => error);
      }),
    );
  }

  updateAdminProfile(profileData: any): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/profile`, profileData, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.notificationService.showSuccess('Profil administrateur mis à jour')),
        catchError((error) => {
          console.error('❌ Erreur mise à jour profil:', error);
          this.notificationService.showError('Erreur lors de la mise à jour du profil');
          return throwError(() => error);
        }),
      );
  }
}