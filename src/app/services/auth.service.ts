import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { User, LoginResponse } from '../models/user.model'; // Retirer RegisterData d'ici

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  // Admin par défaut
  private readonly DEFAULT_ADMIN: User = {
    id: 'admin_default',
    email: 'admin@spaye.com',
    firstName: 'Admin',
    lastName: 'SPaye',
    phoneNumber: '0340000000',
    balance: 0,
    qrCode: 'ADMIN-SPAYE-2026',
    friends: [],
    role: 'super_admin',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    lastLogin: new Date(),
    profilePicture: 'assets/admin-avatar.png',
    bio: 'Administrateur du système'
  };

  private readonly DEFAULT_ADMIN_PASSWORD = 'spaye@2026';

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
        
        if (!user || !user.id || user.balance === undefined) {
          console.log('Utilisateur invalide, déconnexion');
          this.logout();
          return;
        }
        
        this.currentUserSubject.next(user);
      } catch (e) {
        console.log('Erreur de parsing, déconnexion');
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    if (email === this.DEFAULT_ADMIN.email && password === this.DEFAULT_ADMIN_PASSWORD) {
      const response: LoginResponse = {
        user: this.DEFAULT_ADMIN,
        token: 'admin_default_token_' + Date.now()
      };
      
      return new Observable(observer => {
        setTimeout(() => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          
          this.notificationService.showSuccess('Bienvenue Administrateur !');
          this.router.navigate(['/admin']);
          
          observer.next(response);
          observer.complete();
        }, 500);
      });
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        if (response.user.role === 'admin' || response.user.role === 'super_admin') {
          this.router.navigate(['/admin']);
          this.notificationService.showSuccess('Bienvenue administrateur !');
        } else {
          this.router.navigate(['/user']);
          this.notificationService.showSuccess('Connexion réussie !');
        }
      }),
      catchError(error => {
        const message = error.error?.message || 'Email ou mot de passe incorrect';
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  register(userData: any): Observable<LoginResponse> {
    const mockUser: User = {
      id: 'user_' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber || '',
      balance: 0,
      qrCode: 'USER-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      friends: [],
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      bio: ''
    };

    const mockResponse: LoginResponse = {
      user: mockUser,
      token: 'user_token_' + Date.now()
    };

    return new Observable(observer => {
      setTimeout(() => {
        localStorage.setItem('token', mockResponse.token);
        localStorage.setItem('user', JSON.stringify(mockResponse.user));
        this.currentUserSubject.next(mockResponse.user);
        
        this.notificationService.showSuccess('Inscription réussie !');
        this.router.navigate(['/user']);
        
        observer.next(mockResponse);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    // Simuler une mise à jour (à remplacer par un appel API réel)
    const updatedUser = { ...currentUser, ...userData };
    
    return new Observable(observer => {
      setTimeout(() => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        observer.next(updatedUser);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Changer le mot de passe
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        this.notificationService.showSuccess('Mot de passe modifié avec succès');
        observer.next({ success: true });
        observer.complete();
      }, 500);
    });
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

  isUser(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'user';
  }
}