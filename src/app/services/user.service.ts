// ============================================================
// USER SERVICE - SPaye
// ============================================================

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

  // ============================================================
  // PARAMÈTRES UTILISATEUR
  // ============================================================

  getUserSettings(): Observable<UserSettings> {
    const defaultSettings: UserSettings = {
      general: { autoplayVideos: true, nsfwFilter: true },
      notifications: {
        email: true, push: true, sms: false,
        friendRequests: true, comments: true, likes: true,
        messages: true, mentions: true, groupActivities: true,
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
      security: { twoFactorAuth: false, sessionTimeout: 30, loginAlerts: true },
      appearance: { theme: 'light', fontSize: 'medium', language: 'fr', compactMode: false }
    };

    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      try {
        return of(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Erreur parsing settings:', e);
      }
    }
    return of(defaultSettings);
  }

  updateUserSettings(settings: UserSettings): Observable<any> {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    return of({ success: true });
  }

  deleteAccount(password: string): Observable<any> {
    return of({ success: true });
  }

  // ============================================================
  // AMIS
  // ============================================================

  getFriendsCount(): Observable<number> {
    return of(42);
  }

  getPostsCount(): Observable<number> {
    return of(128);
  }

  getFriendsList(): Observable<Friend[]> {
    return of([
      { id: '1', name: 'Jean Dupont', mutualFriends: 5 },
      { id: '2', name: 'Marie Martin', mutualFriends: 3 },
      { id: '3', name: 'Pierre Durand', mutualFriends: 8 }
    ]);
  }

  getCloseFriends(): Observable<Friend[]> {
    return of([{ id: '1', name: 'Jean Dupont', mutualFriends: 5 }]);
  }

  getAcquaintances(): Observable<Friend[]> {
    return of([{ id: '3', name: 'Pierre Durand', mutualFriends: 8 }]);
  }

  getPendingFriendRequests(): Observable<FriendRequest[]> {
    return of([{ id: '4', name: 'Sophie Bernard', date: new Date() }]);
  }

  getBlockedUsers(): Observable<BlockedUser[]> {
    return of([]);
  }

  getFriendSuggestions(): Observable<Friend[]> {
    return of([
      { id: '5', name: 'Thomas Petit', mutualFriends: 2 },
      { id: '6', name: 'Julie Robert', mutualFriends: 4 }
    ]);
  }

  getActiveDevices(): Observable<Device[]> {
    return of([
      { id: '1', name: 'Chrome sur Windows', location: 'Paris, France', lastActive: new Date() },
      { id: '2', name: 'Firefox sur Mac', location: 'Lyon, France', lastActive: new Date(Date.now() - 86400000) }
    ]);
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

  // ============================================================
  // PROFIL
  // ============================================================

  uploadProfilePhoto(file: File): Observable<string> {
    return of(URL.createObjectURL(file));
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
    return of(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  }

  reportUser(userId: string, reason: string): Observable<any> {
    return of({ success: true });
  }
}