import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { Admin } from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/admin/auth`;
  private adminSubject = new BehaviorSubject<Admin | null>(null);
  public admin = this.adminSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  login(username: string, password: string): Observable<any> {
    // Simulation pour le test
    return new Observable(observer => {
      setTimeout(() => {
        if (username === 'admin.spaye.com' && password === 'adminspaye123') {
          const admin: Admin = {
            id: 'admin_001',
            username: 'admin.spaye.com',
            email: 'admin@spaye.com',
            role: 'super_admin',
            permissions: ['all'],
            createdAt: new Date()
          };
          localStorage.setItem('admin_token', 'fake_token');
          localStorage.setItem('admin', JSON.stringify(admin));
          this.adminSubject.next(admin);
          this.notificationService.showSuccess('Connexion admin réussie !');
          observer.next({ admin, token: 'fake_token' });
        } else {
          this.notificationService.showError('Identifiants incorrects');
          observer.error(new Error('Invalid credentials'));
        }
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    this.adminSubject.next(null);
    this.notificationService.showInfo('Déconnexion admin réussie');
    this.router.navigate(['/login']);
  }
}