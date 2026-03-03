import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<any> {
    // Simuler une connexion pour le test
    return new Observable(observer => {
      const user = {
        id: '1',
        email: email,
        firstName: 'Jean',
        lastName: 'Rakoto',
        phoneNumber: '0341234567',
        balance: 150000,
        qrCode: 'SPAYE-123456'
      };
      const token = 'fake-jwt-token';
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      
      observer.next({ user, token });
      observer.complete();
    });
  }

  register(userData: any): Observable<any> {
    // Simuler une inscription pour le test
    return new Observable(observer => {
      const user = {
        id: '1',
        ...userData,
        balance: 0,
        qrCode: 'SPAYE-' + Math.random().toString(36).substr(2, 9)
      };
      const token = 'fake-jwt-token';
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      
      observer.next({ user, token });
      observer.complete();
    });
  }

  googleLogin(): void {
    // Simuler une connexion Google
    const user = {
      id: '1',
      email: 'user@gmail.com',
      firstName: 'Google',
      lastName: 'User',
      phoneNumber: '',
      balance: 0,
      qrCode: 'SPAYE-GOOGLE-123'
    };
    const token = 'fake-google-jwt-token';
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}