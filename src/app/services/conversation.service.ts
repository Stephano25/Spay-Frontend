import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators'; // AJOUTER CET IMPORT
import { environment } from '../../environments/environment';

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private storageKey = 'chat_conversations';

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les conversations
   */
  getConversations(): Observable<Conversation[]> {
    // Essayer de charger depuis l'API d'abord
    return this.http.get<Conversation[]>(`${environment.apiUrl}/chat/conversations`).pipe(
      catchError(() => {
        // Fallback sur le localStorage
        const conversations = localStorage.getItem(this.storageKey);
        return of(conversations ? JSON.parse(conversations) : []);
      })
    );
  }

  /**
   * Ajouter une nouvelle conversation
   */
  addConversation(conversation: Conversation): void {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    
    // Vérifier si la conversation existe déjà
    const existingIndex = conversations.findIndex((c: Conversation) => c.userId === conversation.userId);
    
    if (existingIndex !== -1) {
      // Mettre à jour la conversation existante
      conversations[existingIndex] = { ...conversations[existingIndex], ...conversation };
    } else {
      // Ajouter la nouvelle conversation au début
      conversations.unshift(conversation);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(conversations));
  }

  /**
   * Mettre à jour une conversation
   */
  updateConversation(userId: string, updates: Partial<Conversation>): void {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const index = conversations.findIndex((c: Conversation) => c.userId === userId);
    
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    }
  }

  /**
   * Supprimer une conversation
   */
  removeConversation(userId: string): void {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const filtered = conversations.filter((c: Conversation) => c.userId !== userId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }
}