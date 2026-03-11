import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Services
import { ChatService, Message, Conversation, TypingIndicator } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { FriendService } from '../../services/friend.service';

// Models
import { Friend } from '../../models/friend.model';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Données
  conversations: Conversation[] = [];
  friends: Friend[] = [];
  allChatContacts: any[] = []; // Fusion des conversations et des amis sans conversation
  messages: Message[] = [];
  selectedContact: any = null;
  currentUserId: string = '';
  
  // UI
  newMessage = '';
  isLoading = true;
  isSending = false;
  isTyping = false;
  typingTimeout: any;
  showEmojiPicker = false;
  searchQuery = '';
  activeTab = 0; // 0: Tous, 1: Amis, 2: Conversations
  
  // Pagination
  isLoadingMore = false;
  hasMoreMessages = true;
  messagePage = 1;
  pageSize = 20;

  private subscriptions: Subscription[] = [];
  private typingUsers: Set<string> = new Set();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private friendService: FriendService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.chatService.requestNotificationPermission();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupSocketListeners();
    
    this.route.queryParams.subscribe(params => {
      if (params['friendId']) {
        this.openConversationWithFriend(params['friendId']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  /**
   * Charger toutes les données (conversations ET amis)
   */
  private loadData(): void {
    this.isLoading = true;
    
    forkJoin({
      conversations: this.chatService.getConversations().pipe(catchError(() => of([]))),
      friends: this.friendService.getFriends().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.conversations = result.conversations;
        this.friends = result.friends;
        
        // Fusionner les conversations et les amis
        this.mergeContacts();
        this.isLoading = false;
        console.log('📋 Données chargées:', { 
          conversations: this.conversations, 
          friends: this.friends,
          contacts: this.allChatContacts 
        });
      },
      error: (error) => {
        console.error('❌ Erreur chargement données:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Fusionner les conversations et les amis pour avoir tous les contacts
   */
  private mergeContacts(): void {
    const contactMap = new Map();
    
    // Ajouter d'abord toutes les conversations
    this.conversations.forEach(conv => {
      contactMap.set(conv.userId, {
        id: conv.userId,
        userId: conv.userId,
        firstName: conv.firstName,
        lastName: conv.lastName,
        profilePicture: conv.profilePicture,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount || 0,
        isOnline: conv.isOnline || false,
        hasConversation: true,
        isFriend: true
      });
    });
    
    // Ajouter les amis qui n'ont pas encore de conversation
    this.friends.forEach(friend => {
      if (friend.friend && !contactMap.has(friend.friend.id)) {
        contactMap.set(friend.friend.id, {
          id: friend.friend.id,
          userId: friend.friend.id,
          firstName: friend.friend.firstName,
          lastName: friend.friend.lastName,
          profilePicture: friend.friend.profilePicture,
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0,
          isOnline: friend.friend.isOnline || false,
          hasConversation: false,
          isFriend: true
        });
      }
    });
    
    this.allChatContacts = Array.from(contactMap.values());
    
    // Trier par date du dernier message (les plus récents en premier)
    this.allChatContacts.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }

  /**
   * Filtrer les contacts selon la recherche
   */
  get filteredContacts(): any[] {
    if (!this.searchQuery.trim()) {
      return this.allChatContacts;
    }
    const query = this.searchQuery.toLowerCase();
    return this.allChatContacts.filter(contact => 
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query)
    );
  }

  /**
   * Obtenir les contacts selon l'onglet actif
   */
  get displayedContacts(): any[] {
    const filtered = this.filteredContacts;
    
    switch(this.activeTab) {
      case 1: // Amis uniquement
        return filtered.filter(c => c.isFriend);
      case 2: // Conversations uniquement
        return filtered.filter(c => c.hasConversation);
      default: // Tous
        return filtered;
    }
  }

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(message => {
        if (message) this.handleNewMessage(message);
      })
    );

    this.subscriptions.push(
      this.chatService.typing$.subscribe(data => {
        if (data) this.handleTyping(data);
      })
    );

    this.subscriptions.push(
      this.chatService.onlineStatus$.subscribe(data => {
        if (data) this.handleOnlineStatus(data);
      })
    );
  }

  /**
   * Charger les messages avec un contact
   */
  loadMessages(userId: string): void {
    this.isLoading = true;
    this.messages = [];
    this.messagePage = 1;
    this.hasMoreMessages = true;
    
    this.subscriptions.push(
      this.chatService.getMessages(userId).subscribe({
        next: (messages) => {
          this.messages = messages;
          this.isLoading = false;
          
          // Marquer comme lus
          this.chatService.markAsRead(userId).subscribe();
          
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Erreur chargement messages:', error);
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * Sélectionner un contact pour discuter
   */
  selectContact(contact: any): void {
    this.selectedContact = contact;
    this.loadMessages(contact.userId);
    
    // Mettre à jour le statut en ligne
    const friend = this.friends.find(f => f.friend?.id === contact.userId);
    if (friend) {
      contact.isOnline = friend.friend?.isOnline || false;
    }
  }

  /**
   * Ouvrir une conversation avec un ami spécifique
   */
  openConversationWithFriend(friendId: string): void {
    const contact = this.allChatContacts.find(c => c.userId === friendId);
    if (contact) {
      this.selectContact(contact);
    } else {
      // Si pas dans la liste, rediriger vers la liste d'amis
      this.notificationService.showInfo('Cet utilisateur n\'est pas dans votre liste d\'amis');
      this.router.navigate(['/friends']);
    }
  }

  /**
   * Démarrer une nouvelle conversation avec un ami
   */
  startNewConversation(friendId: string): void {
    const contact = this.allChatContacts.find(c => c.userId === friendId);
    if (contact) {
      this.selectContact(contact);
    }
  }

  /**
   * Gérer un nouveau message
   */
  private handleNewMessage(message: Message): void {
    console.log('📨 Nouveau message reçu:', message);
    
    // Ajouter aux messages si c'est la conversation active
    if (this.selectedContact && 
        (message.senderId === this.selectedContact.userId || 
         message.receiverId === this.selectedContact.userId)) {
      this.messages.push(message);
      this.scrollToBottom();
      
      if (message.senderId === this.selectedContact.userId) {
        this.chatService.markAsRead(this.selectedContact.userId).subscribe();
      }
    }

    // Mettre à jour la liste des contacts
    this.updateContactFromMessage(message);
  }

  /**
   * Mettre à jour un contact à partir d'un message
   */
  private updateContactFromMessage(message: Message): void {
    const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
    let contact = this.allChatContacts.find(c => c.userId === otherUserId);

    if (contact) {
      contact.lastMessage = {
        content: message.content || message.emoji || (message.type === 'image' ? '📷 Image' : 'Nouveau message'),
        type: message.type,
        createdAt: message.createdAt
      };
      contact.lastMessageTime = message.createdAt;
      contact.hasConversation = true;
      
      if (message.senderId !== this.currentUserId && 
          (!this.selectedContact || this.selectedContact.userId !== otherUserId)) {
        contact.unreadCount = (contact.unreadCount || 0) + 1;
      }
      
      // Remonter le contact dans la liste
      this.allChatContacts.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    }
  }

  private handleTyping(data: TypingIndicator): void {
    if (data.isTyping) {
      this.typingUsers.add(data.userId);
    } else {
      this.typingUsers.delete(data.userId);
    }

    this.isTyping = this.selectedContact ? 
      this.typingUsers.has(this.selectedContact.userId) : false;
  }

  private handleOnlineStatus(data: { userId: string; isOnline: boolean }): void {
    const contact = this.allChatContacts.find(c => c.userId === data.userId);
    if (contact) {
      contact.isOnline = data.isOnline;
    }

    if (this.selectedContact?.userId === data.userId) {
      this.selectedContact.isOnline = data.isOnline;
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact || this.isSending) return;

    this.isSending = true;
    
    const message = {
      receiverId: this.selectedContact.userId,
      type: 'text' as const,
      content: this.newMessage.trim()
    };

    this.chatService.sendMessage(message);
    
    // Ajouter le message localement
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: this.newMessage.trim(),
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMessage);
    
    // Mettre à jour le contact
    this.selectedContact.lastMessage = {
      content: this.newMessage.trim(),
      type: 'text',
      createdAt: new Date()
    };
    this.selectedContact.lastMessageTime = new Date();
    this.selectedContact.hasConversation = true;
    
    this.newMessage = '';
    this.isSending = false;
    this.scrollToBottom();
    
    this.chatService.sendTyping(this.selectedContact.userId, false);
  }

  // ... (les autres méthodes restent identiques : sendEmoji, sendMoney, uploadFile, etc.)

  /**
   * Naviguer vers l'envoi d'argent
   */
  navigateToSendMoney(): void {
    if (this.selectedContact) {
      this.router.navigate(['/transactions/send'], {
        queryParams: {
          friendId: this.selectedContact.userId,
          friendName: `${this.selectedContact.firstName} ${this.selectedContact.lastName}`
        }
      });
    } else {
      this.router.navigate(['/transactions/send']);
    }
  }

  /**
   * Aller vers la liste d'amis pour ajouter des contacts
   */
  goToFriends(): void {
    this.router.navigate(['/friends']);
  }

  /**
   * Recharger les données
   */
  refreshData(): void {
    this.loadData();
  }

  // Méthodes déjà existantes à conserver...
  openImage(imageUrl: string | undefined | null): void {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: any): void {
    const container = this.messageContainer.nativeElement;
    if (container.scrollTop < 50 && this.hasMoreMessages && !this.isLoadingMore) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages(): void {
    if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return;
    
    this.isLoadingMore = true;
    this.messagePage++;
    
    setTimeout(() => {
      this.isLoadingMore = false;
      if (this.messagePage > 3) {
        this.hasMoreMessages = false;
      }
    }, 1000);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact) return;

    const message = {
      receiverId: this.selectedContact.userId,
      type: 'emoji' as const,
      emoji: emoji
    };

    this.chatService.sendMessage(message);
    
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMessage);
    
    this.selectedContact.lastMessage = {
      content: emoji,
      type: 'emoji',
      createdAt: new Date()
    };
    this.selectedContact.lastMessageTime = new Date();
    
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  sendMoney(): void {
    if (!this.selectedContact) return;

    const amount = prompt(`Montant à envoyer à ${this.selectedContact.firstName}:`, '1000');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const message = {
        receiverId: this.selectedContact!.userId,
        type: 'money' as const,
        moneyTransfer: {
          amount: Number(amount)
        }
      };
      this.chatService.sendMessage(message);
      
      const tempMessage: Message = {
        id: 'temp-' + Date.now(),
        senderId: this.currentUserId,
        receiverId: this.selectedContact!.userId,
        type: 'money',
        moneyTransfer: {
          amount: Number(amount),
          status: 'pending'
        },
        isRead: false,
        isDelivered: false,
        createdAt: new Date()
      };
      this.messages.push(tempMessage);
      
      this.selectedContact.lastMessage = {
        content: `💰 ${amount} Ar`,
        type: 'money',
        createdAt: new Date()
      };
      this.selectedContact.lastMessageTime = new Date();
      
      this.scrollToBottom();
    }
  }

  uploadFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedContact) return;

    if (file.size > 150 * 1024 * 1024) {
      this.notificationService.showError('Fichier trop volumineux (max 150 Mo)');
      return;
    }

    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const message = {
          receiverId: this.selectedContact!.userId,
          type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize
        };
        this.chatService.sendMessage(message);
        
        const tempMessage: Message = {
          id: 'temp-' + Date.now(),
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          isRead: false,
          isDelivered: false,
          createdAt: new Date()
        };
        this.messages.push(tempMessage);
        
        this.selectedContact.lastMessage = {
          content: file.type.startsWith('image/') ? '📷 Image' : `📎 ${result.fileName}`,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          createdAt: new Date()
        };
        this.selectedContact.lastMessageTime = new Date();
        
        this.isSending = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Erreur upload:', error);
        this.notificationService.showError('Erreur lors de l\'upload');
        this.isSending = false;
      }
    });
  }

  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact) return;

    if (!this.selectedContact.isOnline) {
      this.notificationService.showWarning('Cet utilisateur n\'est pas en ligne');
      return;
    }

    this.notificationService.showInfo(`Appel ${type} démarré avec ${this.selectedContact.firstName} (simulation)`);
  }

  onTyping(): void {
    if (!this.selectedContact) return;

    this.chatService.sendTyping(this.selectedContact.userId, true);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedContact) {
        this.chatService.sendTyping(this.selectedContact.userId, false);
      }
    }, 1000);
  }

  formatMessageTime(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('fr-MG', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier ' + messageDate.toLocaleTimeString('fr-MG', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('fr-MG', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  }

  formatLastSeen(date?: Date): string {
    if (!date) return 'Jamais connecté';
    
    const lastSeen = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return lastSeen.toLocaleDateString('fr-MG');
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 100);
  }

  goBack(): void {
    this.selectedContact = null;
  }

  // Compteurs pour les onglets
  getFriendsCount(): number {
    return this.allChatContacts.filter(c => c.isFriend).length;
  }

  getConversationsCount(): number {
    return this.allChatContacts.filter(c => c.hasConversation).length;
  }

  // Contacts filtrés par type
  getFriendsContacts(): any[] {
    return this.filteredContacts.filter(c => c.isFriend);
  }

  getConversationsContacts(): any[] {
    return this.filteredContacts.filter(c => c.hasConversation);
  }

  // Gestionnaire d'erreur d'image
  handleImageError(message: Message): void {
    message.fileUrl = undefined;
  }

  // Toggle emoji picker
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
}