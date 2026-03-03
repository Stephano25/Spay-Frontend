import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    transactionAlerts: boolean;
    promoEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showLastSeen: boolean;
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    compactMode: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  /**
   * Récupérer les paramètres de l'utilisateur depuis le localStorage
   */
  getUserSettings(): Observable<UserSettings> {
    const defaultSettings: UserSettings = {
      notifications: {
        email: true,
        push: true,
        sms: false,
        transactionAlerts: true,
        promoEmails: false
      },
      privacy: {
        profileVisibility: 'friends',
        showLastSeen: true,
        showOnlineStatus: true,
        allowFriendRequests: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        loginAlerts: true
      },
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        language: 'fr',
        compactMode: false
      }
    };

    // Essayer de charger depuis le localStorage
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return of(parsed);
      } catch (e) {
        console.error('Erreur parsing settings:', e);
      }
    }

    // Retourner les settings par défaut
    return of(defaultSettings);
  }

  /**
   * Sauvegarder les paramètres dans le localStorage uniquement
   */
  updateUserSettings(settings: UserSettings): Observable<any> {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    return of({ success: true });
  }

  /**
   * Supprimer le compte utilisateur
   */
  deleteAccount(password: string): Observable<any> {
    // Simulation - à remplacer par un vrai appel API
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true });
        observer.complete();
      }, 500);
    });
  }
}