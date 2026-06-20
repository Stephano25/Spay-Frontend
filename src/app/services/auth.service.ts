// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User, LoginResponse, RegisterData } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private usersApiUrl = `${environment.apiUrl}/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        if (!token) throw new Error('Token manquant');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.router.navigate(['/user']);
        this.notificationService.showSuccess('Connexion réussie !');
      }),
      catchError(error => {
        const message = error.error?.message || 'Erreur de connexion';
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterData): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        if (!token) throw new Error('Token manquant');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.notificationService.showSuccess('Inscription réussie !');
        this.router.navigate(['/user']);
      }),
      catchError(error => {
        const message = error.error?.message || "Erreur d'inscription";
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur chargement profil');
        return throwError(() => error);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.usersApiUrl}/profile`, userData).pipe(
      tap(updated => {
        localStorage.setItem('user', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        this.notificationService.showSuccess('Profil mis à jour');
      }),
      catchError(error => {
        this.notificationService.showError('Erreur mise à jour');
        return throwError(() => error);
      })
    );
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => this.notificationService.showSuccess('Mot de passe modifié')),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur');
        return throwError(() => error);
      })
    );
  }

  uploadProfilePicture(formData: FormData): Observable<any> {
    return this.http.post(`${this.usersApiUrl}/upload-profile-picture`, formData).pipe(
      tap((response: any) => {
        if (response.user) this.updateCurrentUser(response.user);
      }),
      catchError(error => {
        this.notificationService.showError('Erreur upload');
        return throwError(() => error);
      })
    );
  }

  deleteProfilePicture(): Observable<any> {
    return this.http.delete(`${this.usersApiUrl}/profile-picture`).pipe(
      catchError(error => {
        this.notificationService.showError('Erreur suppression');
        return throwError(() => error);
      })
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
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin' || user?.role === 'super_admin';
  }
}