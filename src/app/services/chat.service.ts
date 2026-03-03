import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Simuler les événements socket pour le moment
  onNewMessage(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  onMessageSent(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  onUserTyping(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  onIncomingCall(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  onCallAccepted(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  onIceCandidate(): Observable<any> {
    return new Observable((observer) => {
      // Simulation
    });
  }

  sendMessage(message: any): void {
    console.log('Message envoyé:', message);
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    console.log('Typing:', receiverId, isTyping);
  }

  startCall(receiverId: string, type: 'video' | 'audio'): void {
    console.log('Call started:', receiverId, type);
  }

  acceptCall(callerId: string, signal: any): void {
    console.log('Call accepted:', callerId, signal);
  }

  sendIceCandidate(userId: string, candidate: any): void {
    console.log('ICE candidate:', userId, candidate);
  }

  getMessages(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/messages/${userId}`);
  }

  getConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/conversations`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/chat/upload`, formData);
  }

  searchUsers(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/search?q=${query}`);
  }
}