// ============================================================
// IP SERVICE - SPaye
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment, setLocalIp, getLocalIp } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère l'IP publique du serveur
   */
  getPublicIp(): Observable<string> {
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
      map(response => response.ip),
      catchError(() => {
        // Fallback: essayer une autre API
        return this.http.get<{ ip: string }>('https://api.my-ip.io/ip.json').pipe(
          map(response => response.ip),
          catchError(() => of(''))
        );
      })
    );
  }

  /**
   * Récupère l'IP locale du serveur backend
   * Essayer plusieurs méthodes
   */
  getLocalIp(): Observable<string> {
    // Vérifier si une IP est stockée
    const savedIp = getLocalIp();
    if (savedIp) {
      return of(savedIp);
    }

    // Essayer de détecter l'IP depuis l'URL
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return of(hostname);
    }

    // Essayer de récupérer l'IP via une API
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
      map(response => {
        const ip = response.ip;
        setLocalIp(ip);
        return ip;
      }),
      catchError(() => {
        // Fallback: utiliser une IP par défaut
        const defaultIp = '192.168.1.100';
        setLocalIp(defaultIp);
        return of(defaultIp);
      })
    );
  }

  /**
   * Teste si une URL est accessible
   */
  testUrl(url: string): Observable<boolean> {
    return this.http.get(`${url}/health`, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  /**
   * Trouve automatiquement le backend en testant plusieurs IP
   */
  autoDetectBackend(): Observable<string> {
    // Liste des IP à tester (à adapter à votre réseau)
    const ipsToTest: string[] = [];

    // Ajouter l'IP locale actuelle si disponible
    const currentIp = getLocalIp();
    if (currentIp) {
      ipsToTest.push(currentIp);
    }

    // Ajouter l'IP du serveur (si différente)
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== currentIp) {
      ipsToTest.push(hostname);
    }

    // Ajouter des IPs communes
    const commonIps = ['192.168.1.100', '192.168.1.101', '192.168.1.102', '10.0.0.100', '10.0.0.101'];
    for (const ip of commonIps) {
      if (!ipsToTest.includes(ip)) {
        ipsToTest.push(ip);
      }
    }

    // Ajouter localhost en dernier recours
    if (!ipsToTest.includes('localhost')) {
      ipsToTest.push('localhost');
    }

    // Tester chaque IP
    return new Observable((observer) => {
      let tested = 0;
      let found = false;

      for (const ip of ipsToTest) {
        const url = `http://${ip}:3000`;
        this.testUrl(url).subscribe({
          next: (isValid) => {
            tested++;
            if (isValid && !found) {
              found = true;
              setLocalIp(ip);
              observer.next(ip);
              observer.complete();
            } else if (tested === ipsToTest.length && !found) {
              // Aucune IP trouvée, utiliser la première
              const defaultIp = ipsToTest[0] || 'localhost';
              setLocalIp(defaultIp);
              observer.next(defaultIp);
              observer.complete();
            }
          },
          error: () => {
            tested++;
            if (tested === ipsToTest.length && !found) {
              const defaultIp = ipsToTest[0] || 'localhost';
              setLocalIp(defaultIp);
              observer.next(defaultIp);
              observer.complete();
            }
          }
        });
      }
    });
  }
}