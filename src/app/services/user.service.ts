// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserSettings } from '../models/user.model';

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends: number;
}

export interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  date: Date;
}

export interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  lastActive: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() {}

  /**
   * Récupérer les paramètres de l'utilisateur
   */
  getUserSettings(): Observable<UserSettings> {
    const defaultSettings: UserSettings = {
      general: {
        autoplayVideos: true,
        nsfwFilter: true
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
        friendRequests: true,
        comments: true,
        likes: true,
        messages: true,
        mentions: true,
        groupActivities: true,
        dailyDigest: 'daily'
      },
      privacy: {
        profileVisibility: 'friends',
        postVisibility: 'friends',
        showLastSeen: true,
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowMessagesFromNonFriends: false
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

    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return of(parsed);
      } catch (e) {
        console.error('Erreur parsing settings:', e);
      }
    }

    return of(defaultSettings);
  }

  /**
   * Sauvegarder les paramètres
   */
  updateUserSettings(settings: UserSettings): Observable<any> {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    return of({ success: true });
  }

  /**
   * Supprimer le compte utilisateur
   */
  deleteAccount(password: string): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true });
        observer.complete();
      }, 500);
    });
  }

  // ============ MÉTHODES POUR LES AMIS ============

  getFriendsCount(): Observable<number> {
    return of(42);
  }

  getPostsCount(): Observable<number> {
    return of(128);
  }

  getFriendsList(): Observable<Friend[]> {
    const friends: Friend[] = [
      { id: '1', name: 'Jean Dupont', mutualFriends: 5 },
      { id: '2', name: 'Marie Martin', mutualFriends: 3 },
      { id: '3', name: 'Pierre Durand', mutualFriends: 8 }
    ];
    return of(friends);
  }

  getCloseFriends(): Observable<Friend[]> {
    const closeFriends: Friend[] = [
      { id: '1', name: 'Jean Dupont', mutualFriends: 5 }
    ];
    return of(closeFriends);
  }

  getAcquaintances(): Observable<Friend[]> {
    const acquaintances: Friend[] = [
      { id: '3', name: 'Pierre Durand', mutualFriends: 8 }
    ];
    return of(acquaintances);
  }

  getPendingFriendRequests(): Observable<FriendRequest[]> {
    const requests: FriendRequest[] = [
      { id: '4', name: 'Sophie Bernard', date: new Date() }
    ];
    return of(requests);
  }

  getBlockedUsers(): Observable<BlockedUser[]> {
    return of([]);
  }

  getFriendSuggestions(): Observable<Friend[]> {
    const suggestions: Friend[] = [
      { id: '5', name: 'Thomas Petit', mutualFriends: 2 },
      { id: '6', name: 'Julie Robert', mutualFriends: 4 }
    ];
    return of(suggestions);
  }

  getActiveDevices(): Observable<Device[]> {
    const devices: Device[] = [
      { id: '1', name: 'Chrome sur Windows', location: 'Paris, France', lastActive: new Date() },
      { id: '2', name: 'Firefox sur Mac', location: 'Lyon, France', lastActive: new Date(Date.now() - 86400000) }
    ];
    return of(devices);
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return of({ success: true });
  }

  rejectFriendRequest(requestId: string): Observable<any> {
    return of({ success: true });
  }

  sendFriendRequest(userId: string): Observable<any> {
    return of({ success: true });
  }

  unfriend(friendId: string): Observable<any> {
    return of({ success: true });
  }

  blockUser(userId: string): Observable<any> {
    return of({ success: true });
  }

  unblockUser(userId: string): Observable<any> {
    return of({ success: true });
  }

  revokeDevice(deviceId: string): Observable<any> {
    return of({ success: true });
  }

  logoutAllDevices(): Observable<any> {
    return of({ success: true });
  }

  // ============ GESTION DU PROFIL ============

  uploadProfilePhoto(file: File): Observable<string> {
    const fakeUrl = URL.createObjectURL(file);
    return of(fakeUrl);
  }

  removeProfilePhoto(): Observable<any> {
    return of({ success: true });
  }

  changeEmail(newEmail: string): Observable<any> {
    return of({ success: true });
  }

  changePhoneNumber(newPhone: string): Observable<any> {
    return of({ success: true });
  }

  deactivateAccount(password: string): Observable<any> {
    return of({ success: true });
  }

  downloadUserData(): Observable<Blob> {
    const data = { user: {}, settings: {} };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return of(blob);
  }

  reportUser(userId: string, reason: string): Observable<any> {
    return of({ success: true });
  }
}