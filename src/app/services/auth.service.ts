import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture?: string;
  balance: number;
  qrCode: string;
  friends: string[];
}

export interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
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
        this.validateToken().subscribe({
          error: () => this.logout()
        });
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
        this.notificationService.showSuccess('Connexion réussie !');
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
      }),
      catchError(error => {
        this.notificationService.showError(error.error?.message || "Erreur d'inscription");
        return throwError(() => error);
      })
    );
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google`;
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

  private validateToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/validate`);
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

  uploadProfilePicture(file: File): Observable<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ profilePicture: string }>(`${this.apiUrl}/profile/picture`, formData).pipe(
      tap(response => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          currentUser.profilePicture = response.profilePicture;
          localStorage.setItem('user', JSON.stringify(currentUser));
          this.currentUserSubject.next(currentUser);
        }
        this.notificationService.showSuccess('Photo de profil mise à jour');
      }),
      catchError(error => {
        this.notificationService.showError("Erreur lors de l'upload");
        return throwError(() => error);
      })
    );
  }
}