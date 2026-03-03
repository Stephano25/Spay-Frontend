import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService { // Changé de AdminAuthService à AdminService
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`).pipe(
      catchError(error => {
        console.error('Erreur chargement stats admin:', error);
        return throwError(() => error);
      })
    );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`).pipe(
      catchError(error => {
        console.error('Erreur chargement utilisateurs:', error);
        return throwError(() => error);
      })
    );
  }

  getAllTransactions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions`).pipe(
      catchError(error => {
        console.error('Erreur chargement transactions:', error);
        return throwError(() => error);
      })
    );
  }
}