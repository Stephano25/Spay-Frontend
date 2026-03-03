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
    
    console.log('📦 Token du localStorage:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        console.log('✅ Utilisateur chargé:', user.email);
      } catch (e) {
        console.log('❌ Erreur de parsing, déconnexion');
        this.logout();
      }
    } else {
      console.log('ℹ️ Aucun utilisateur connecté');
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    console.log('📡 Tentative de connexion pour:', email);
    
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // Le backend renvoie access_token, pas token
        const token = response.access_token || response.token;
        
        if (!token) {
          console.error('❌ Réponse invalide - token manquant:', response);
          throw new Error('Token manquant dans la réponse');
        }
        
        console.log('✅ Connexion réussie, token reçu:', token.substring(0, 20) + '...');
        console.log('👤 Utilisateur:', response.user);
        
        localStorage.setItem('token', token);
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
        console.error('❌ Erreur connexion:', error);
        
        let message = 'Erreur de connexion';
        if (error.error?.message) {
          message = error.error.message;
        } else if (error.status === 0) {
          message = 'Impossible de contacter le serveur';
        } else if (error.status === 401) {
          message = 'Email ou mot de passe incorrect';
        } else if (error.status === 404) {
          message = 'API non trouvée';
        }
        
        this.notificationService.showError(message);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterData): Observable<LoginResponse> {
    console.log('📡 Tentative d\'inscription pour:', userData.email);
    
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        const token = response.access_token || response.token;
        
        if (!token) {
          console.error('❌ Réponse invalide - token manquant:', response);
          throw new Error('Token manquant dans la réponse');
        }
        
        console.log('✅ Inscription réussie, token reçu:', token.substring(0, 20) + '...');
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        
        this.notificationService.showSuccess('Inscription réussie !');
        this.router.navigate(['/user']);
      }),
      catchError(error => {
        console.error('❌ Erreur inscription:', error);
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
        console.log('✅ Profil mis à jour:', updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        this.notificationService.showSuccess('Profil mis à jour avec succès');
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour profil:', error);
        this.notificationService.showError('Erreur lors de la mise à jour du profil');
        return throwError(() => error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        console.log('✅ Mot de passe changé avec succès');
        this.notificationService.showSuccess('Mot de passe modifié avec succès');
      }),
      catchError(error => {
        console.error('❌ Erreur changement mot de passe:', error);
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

  isUser(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'user';
  }
}