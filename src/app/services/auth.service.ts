import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface LoginResponse {
  user: User;
  token: string;
}

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
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
          this.notificationService.showSuccess('Bienvenue administrateur !');
        } else {
          this.router.navigate(['/user']);
          this.notificationService.showSuccess('Connexion réussie !');
        }
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || 'Erreur de connexion');
        return throwError(() => error);
      })
    );
  }

  register(userData: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.notificationService.showSuccess('Inscription réussie !');
        this.router.navigate(['/user']);
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || "Erreur d'inscription");
        return throwError(() => error);
      })
    );
  }

  // Supprimer googleLogin() ou le commenter si non utilisé
  // googleLogin(): void {
  //   window.location.href = `${this.apiUrl}/google`;
  // }

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
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'user';
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData).pipe(
      tap(updatedUser => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        this.notificationService.showSuccess('Profil mis à jour');
      }),
      catchError(error => {
        this.notificationService.showError('Erreur lors de la mise à jour');
        return throwError(() => error);
      })
    );
  }
}