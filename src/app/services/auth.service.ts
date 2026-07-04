// frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User, LoginResponse, RegisterData } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private uploadUrl = environment.uploadUrl || `${environment.baseUrl}/uploads`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.loadStoredUser();
  }

  /**
   * ✅ Construire l'URL complète de l'image (externe ou interne)
   */
  private getFullImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('/uploads')) {
      if (environment.production) {
        return url;
      }
      return `${environment.baseUrl}${url}`;
    }
    
    if (url.startsWith('/assets')) {
      if (environment.isReactNative) {
        return `${environment.baseUrl}${url}`;
      }
      return url;
    }
    
    if (!url.includes('/')) {
      if (url.startsWith('profile-')) {
        if (environment.production) {
          return `/uploads/profiles/${url}`;
        }
        return `${environment.baseUrl}/uploads/profiles/${url}`;
      }
      if (environment.isReactNative) {
        return `${environment.baseUrl}/assets/profiles/${url}`;
      }
      return `/assets/profiles/${url}`;
    }
    
    return url;
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        user.profilePicture = this.getFullImageUrl(user.profilePicture) || undefined;
        this.currentUserSubject.next(user);
        console.log('👤 Utilisateur chargé depuis localStorage:', user.email, 'Rôle:', user.role);
      } catch {
        console.log('❌ Erreur chargement utilisateur');
        this.logout();
      }
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    });
  }

  // ✅ Gestion d'erreur améliorée
  private handleError(error: HttpErrorResponse, fallback?: any): Observable<any> {
    console.error('❌ Erreur HTTP:', error);
    
    // Si c'est une erreur de connexion (502, 503, etc.)
    if (error.status === 502 || error.status === 503 || error.status === 0) {
      this.notificationService.showError('Le serveur est indisponible. Veuillez réessayer plus tard.');
      return of(fallback || null);
    }
    
    const message = error.error?.message || 'Erreur de communication';
    this.notificationService.showError(message);
    return throwError(() => error);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    console.log('🔐 Tentative de connexion:', email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        if (!token) throw new Error('Token manquant');

        response.user.profilePicture = this.getFullImageUrl(response.user.profilePicture) || undefined;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);

        console.log('✅ Connexion réussie:', response.user.email, 'Rôle:', response.user.role);

        const user = response.user;
        if (user.role === 'admin' || user.role === 'super_admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/user/dashboard']);
        }

        this.notificationService.showSuccess('Connexion réussie !');
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  register(userData: RegisterData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        if (!token) throw new Error('Token manquant');

        response.user.profilePicture = this.getFullImageUrl(response.user.profilePicture) || undefined;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);

        const user = response.user;
        if (user.role === 'admin' || user.role === 'super_admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/user/dashboard']);
        }

        this.notificationService.showSuccess('Inscription réussie !');
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/profile`, { headers: this.getHeaders() }).pipe(
      tap(user => {
        user.profilePicture = this.getFullImageUrl(user.profilePicture) || undefined;
        this.updateCurrentUser(user);
      }),
      catchError((error) => {
        if (error.status === 502) {
          this.notificationService.showError('Le serveur est indisponible');
          return of(null as any);
        }
        this.notificationService.showError('Erreur chargement profil');
        return throwError(() => error);
      }),
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, userData, { headers: this.getHeaders() }).pipe(
      tap(updated => {
        updated.profilePicture = this.getFullImageUrl(updated.profilePicture) || undefined;
        localStorage.setItem('user', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        this.notificationService.showSuccess('Profil mis à jour');
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  updateCurrentUser(user: User): void {
    user.profilePicture = this.getFullImageUrl(user.profilePicture) || undefined;
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword }, { headers: this.getHeaders() }).pipe(
      tap(() => this.notificationService.showSuccess('Mot de passe modifié')),
      catchError((error) => this.handleError(error)),
    );
  }

  uploadProfilePicture(formData: FormData): Observable<any> {
    const uploadUrl = environment.isReactNative 
      ? `${environment.baseUrl}/users/upload-profile-picture`
      : `${this.apiUrl}/users/upload-profile-picture`;
      
    return this.http.post(uploadUrl, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`,
      }),
    }).pipe(
      tap((response: any) => {
        if (response.user) {
          const profileUrl = response.profilePictureUrl || response.user?.profilePicture;
          if (profileUrl) {
            response.user.profilePicture = this.getFullImageUrl(profileUrl) || undefined;
            this.updateCurrentUser(response.user);
          }
        }
        this.notificationService.showSuccess('Photo de profil mise à jour');
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  deleteProfilePicture(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/profile-picture`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const user = { ...currentUser, profilePicture: null };
          this.updateCurrentUser(user);
          this.notificationService.showSuccess('Photo supprimée');
        }
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.notificationService.showInfo('Déconnecté');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin' || user?.role === 'super_admin';
  }
}