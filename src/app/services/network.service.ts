// src/app/services/network.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 👈 Import de 'of'
import { map, catchError } from 'rxjs/operators'; // 👈 Import des opérateurs

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  constructor(private http: HttpClient) {}

  /**
   * Détecte l'IP publique
   */
  detectPublicIp(): Observable<{ ip: string }> {
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json');
  }

  /**
   * Teste si une URL est accessible
   */
  testUrl(url: string): Observable<boolean> {
    // Nettoyer l'URL pour éviter les doubles slashes
    const cleanUrl = url.endsWith('/') ? url : `${url}/`;
    return this.http.get(`${cleanUrl}health`, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  /**
   * Teste une URL de socket
   */
  testSocketUrl(url: string): Observable<boolean> {
    const cleanUrl = url.endsWith('/') ? url : `${url}/`;
    return this.http.get(`${cleanUrl}socket.io/`, { observe: 'response' }).pipe(
      map(response => response.status === 200 || response.status === 404),
      catchError(() => of(false))
    );
  }
}