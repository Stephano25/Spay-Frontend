// frontend/src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserSettings } from '../models/user.model';
import { AuthService } from './auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    });
  }

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
    return this.http.patch(`${this.apiUrl}/settings`, settings, { headers: this.getHeaders() });
  }

  deleteAccount(password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, { password }, { headers: this.getHeaders() });
  }

  // ============================================================
  // AMIS
  // ============================================================

  getFriendsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/friends/count`, { headers: this.getHeaders() });
  }

  getPostsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/posts/count`, { headers: this.getHeaders() });
  }

  getFriendsList(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/friends`, { headers: this.getHeaders() });
  }

  getCloseFriends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/friends/close`, { headers: this.getHeaders() });
  }

  getAcquaintances(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/friends/acquaintances`, { headers: this.getHeaders() });
  }

  getPendingFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/friends/requests`, { headers: this.getHeaders() });
  }

  getBlockedUsers(): Observable<BlockedUser[]> {
    return this.http.get<BlockedUser[]>(`${this.apiUrl}/friends/blocked`, { headers: this.getHeaders() });
  }

  getFriendSuggestions(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.apiUrl}/friends/suggestions`, { headers: this.getHeaders() });
  }

  getActiveDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices`, { headers: this.getHeaders() });
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/accept/${requestId}`, {}, { headers: this.getHeaders() });
  }

  rejectFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/reject/${requestId}`, {}, { headers: this.getHeaders() });
  }

  sendFriendRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/request/${userId}`, {}, { headers: this.getHeaders() });
  }

  unfriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`, { headers: this.getHeaders() });
  }

  blockUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/block/${userId}`, {}, { headers: this.getHeaders() });
  }

  unblockUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/unblock/${userId}`, {}, { headers: this.getHeaders() });
  }

  revokeDevice(deviceId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/devices/${deviceId}`, { headers: this.getHeaders() });
  }

  logoutAllDevices(): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/logout-all`, {}, { headers: this.getHeaders() });
  }

  // ============================================================
  // PHOTO DE PROFIL - UPLOAD CORRIGÉ
  // ============================================================

  uploadProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    console.log('📤 Upload de la photo:', file.name);
    console.log('📤 Taille:', file.size, 'bytes');

    const url = `${this.apiUrl}/upload-profile-picture`;
    console.log('📤 URL:', url);

    return this.http.post(url, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`
      })
    });
  }

  removeProfilePhoto(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profile-picture`, { 
      headers: this.getHeaders() 
    });
  }

  // ============================================================
  // PROFIL
  // ============================================================

  changeEmail(newEmail: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/email`, { email: newEmail }, { headers: this.getHeaders() });
  }

  changePhoneNumber(newPhone: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/phone`, { phoneNumber: newPhone }, { headers: this.getHeaders() });
  }

  deactivateAccount(password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/deactivate`, { password }, { headers: this.getHeaders() });
  }

  downloadUserData(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-data`, { 
      headers: this.getHeaders(),
      responseType: 'blob' 
    });
  }

  reportUser(userId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/report/${userId}`, { reason }, { headers: this.getHeaders() });
  }
}