import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User, LoginResponse, RegisterData } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
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
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        
        if (!token) {
          throw new Error('Token manquant dans la réponse');
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        if (response.user.role === 'admin' || response.user.role === 'super_admin') {
          this.router.navigate(['/admin/dashboard']);
          this.notificationService.showSuccess('Bienvenue administrateur !');
        } else {
          this.router.navigate(['/user']);
          this.notificationService.showSuccess('Connexion réussie !');
        }
      }),
      catchError(error => {
        let message = 'Erreur de connexion';
        if (error.error?.message) {
          message = error.error.message;
        } else if (error.status === 0) {
          message = 'Impossible de contacter le serveur';
        } else if (error.status === 401) {
          message = 'Email ou mot de passe incorrect';
        }
        
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterData): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        
        if (!token) {
          throw new Error('Token manquant dans la réponse');
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        this.notificationService.showSuccess('Inscription réussie !');
        this.router.navigate(['/user']);
      }),
      catchError(error => {
        const message = error.error?.message || "Erreur lors de l'inscription";
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    return this.http.put<User>(`${this.apiUrl}/profile`, userData).pipe(
      tap(updatedUser => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        this.notificationService.showSuccess('Profil mis à jour avec succès');
      }),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour du profil');
        return throwError(() => error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        this.notificationService.showSuccess('Mot de passe modifié avec succès');
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur lors du changement de mot de passe');
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.notificationService.showInfo('Vous êtes déconnecté');
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