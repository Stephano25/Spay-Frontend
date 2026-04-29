import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatService, Message, Conversation, TypingIndicator } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { FriendService } from '../../services/friend.service';
import { Friend } from '../../models/friend.model';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  conversations: Conversation[] = [];
  friends: Friend[] = [];
  filteredFriends: Friend[] = [];
  recentConversations: any[] = [];
  allChatContacts: any[] = [];
  messages: Message[] = [];
  selectedContact: any = null;
  currentUserId: string = '';
  isFriend: boolean = false;

  newMessage = '';
  isLoading = true;
  isSending = false;
  isTyping = false;
  typingTimeout: any;
  showEmojiPicker = false;
  searchQuery = '';
  isLoadingMore = false;
  hasMoreMessages = true;
  messagePage = 1;
  pageSize = 20;

  private subscriptions: Subscription[] = [];
  private typingUsers: Set<string> = new Set();
  private messagesCache: Map<string, Message[]> = new Map();
  private lastMessagesMap: Map<string, string> = new Map();
  private unreadCountMap: Map<string, number> = new Map();

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
    if (!this.currentUserId) this.router.navigate(['/login']);
    this.chatService.requestNotificationPermission();
  }

  ngOnInit(): void {
    if (this.currentUserId) {
      this.loadData();
      this.setupSocketListeners();
      this.route.queryParams.subscribe(params => {
        if (params['friendId']) {
          const friend = this.friends.find(f => f.friend?.id === params['friendId']);
          if (friend) {
            setTimeout(() => this.selectFriend(friend), 500);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  // ========== MÉTHODES DE RECHERCHE ET FILTRAGE ==========

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFriends = this.friends;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredFriends = this.friends.filter(friend => 
        friend.friend?.firstName?.toLowerCase().includes(query) ||
        friend.friend?.lastName?.toLowerCase().includes(query) ||
        `${friend.friend?.firstName} ${friend.friend?.lastName}`.toLowerCase().includes(query)
      );
    }
  }

  // ========== SÉLECTION DES CONTACTS ==========

  selectFriend(friend: Friend): void {
    if (!friend.friend?.id) return;
    
    const contact = {
      userId: friend.friend.id,
      firstName: friend.friend.firstName,
      lastName: friend.friend.lastName,
      profilePicture: friend.friend.profilePicture,
      isOnline: friend.friend.isOnline,
      lastSeen: friend.friend.lastSeen
    };
    
    this.selectedContact = contact;
    this.loadMessages(contact.userId);
    this.isFriend = true;
    
    this.chatService.markAsRead(contact.userId).subscribe();
  }

  selectRecentConversation(conv: any): void {
    this.selectedContact = conv;
    this.loadMessages(conv.userId);
    this.checkIfFriend(conv.userId);
  }

  // ========== GESTION DES MESSAGES ==========

  getLastMessageWithFriend(friendId: string | undefined): string {
    if (!friendId) return '';
    return this.lastMessagesMap.get(friendId) || '';
  }

  getUnreadCount(friendId: string | undefined): number {
    if (!friendId) return 0;
    return this.unreadCountMap.get(friendId) || 0;
  }

  private updateMessagesCache(userId: string, messages: Message[]): void {
    this.messagesCache.set(userId, messages);
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const content = lastMessage.content || (lastMessage.type === 'emoji' ? (lastMessage.emoji || '') : 'Message');
      this.lastMessagesMap.set(userId, content);
    }
    
    const unread = messages.filter(m => m.senderId === userId && !m.isRead).length;
    this.unreadCountMap.set(userId, unread);
  }

  loadMessages(userId: string): void {
    if (!userId) return;
    
    const cached = this.messagesCache.get(userId);
    if (cached && this.selectedContact?.userId === userId) {
      this.messages = cached;
      this.scrollToBottom();
      return;
    }
    
    this.isLoading = true;
    this.messages = [];
    this.messagePage = 1;
    this.hasMoreMessages = true;
    
    this.chatService.getMessages(userId).subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.updateMessagesCache(userId, this.messages);
        this.isLoading = false;
        this.chatService.markAsRead(userId).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading = false;
        this.notificationService.showError('Erreur chargement messages');
      }
    });
  }

  loadMoreMessages(): void {
    if (!this.selectedContact?.userId || this.isLoadingMore || !this.hasMoreMessages) return;
    
    this.isLoadingMore = true;
    this.messagePage++;
    this.chatService.getMessagesPage(this.selectedContact.userId, this.messagePage, this.pageSize)
      .subscribe({
        next: (oldMessages) => {
          if (oldMessages && oldMessages.length > 0) {
            this.messages = [...oldMessages, ...this.messages];
          }
          this.isLoadingMore = false;
          if (oldMessages.length < this.pageSize) {
            this.hasMoreMessages = false;
          }
        },
        error: (error) => {
          console.error('Error loading more messages:', error);
          this.isLoadingMore = false;
        }
      });
  }

  // ========== CHARGEMENT DES DONNÉES ==========

  private loadData(): void {
    this.isLoading = true;
    forkJoin({
      conversations: this.chatService.getConversations().pipe(catchError(() => of([]))),
      friends: this.friendService.getFriends().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.conversations = result.conversations;
        this.friends = result.friends.filter(f => f.status === 'accepted');
        this.filteredFriends = this.friends;
        this.recentConversations = result.conversations.slice(0, 5);
        this.mergeContacts();
        this.loadLastMessagesForFriends();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
        this.allChatContacts = [];
      }
    });
  }

  private loadLastMessagesForFriends(): void {
    this.friends.forEach(friend => {
      if (friend.friend?.id) {
        this.chatService.getMessages(friend.friend.id).subscribe({
          next: (msgs) => {
            if (msgs && msgs.length > 0) {
              const lastMessage = msgs[msgs.length - 1];
              const content = lastMessage.content || (lastMessage.type === 'emoji' ? (lastMessage.emoji || '') : 'Message');
              this.lastMessagesMap.set(friend.friend!.id, content);
              const unread = msgs.filter(m => m.senderId === friend.friend?.id && !m.isRead).length;
              this.unreadCountMap.set(friend.friend!.id, unread);
            }
          }
        });
      }
    });
  }

  private mergeContacts(): void {
    const contactMap = new Map();
    
    this.conversations.forEach(conv => {
      if (conv && conv.userId) {
        let lastMessageTime = 0;
        if (conv.lastMessageTime) {
          lastMessageTime = this.getSafeTimestamp(conv.lastMessageTime);
        } else if (conv.lastMessage?.createdAt) {
          lastMessageTime = this.getSafeTimestamp(conv.lastMessage.createdAt);
        }
        
        contactMap.set(conv.userId, {
          userId: conv.userId,
          firstName: conv.firstName || 'Utilisateur',
          lastName: conv.lastName || '',
          profilePicture: conv.profilePicture,
          lastMessage: conv.lastMessage,
          lastMessageTime: lastMessageTime,
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.isOnline || false,
          hasConversation: true,
          isFriend: true
        });
      }
    });
    
    this.friends.forEach(friend => {
      if (friend?.friend?.id && !contactMap.has(friend.friend.id)) {
        contactMap.set(friend.friend.id, {
          userId: friend.friend.id,
          firstName: friend.friend.firstName || 'Utilisateur',
          lastName: friend.friend.lastName || '',
          profilePicture: friend.friend.profilePicture,
          lastMessage: null,
          lastMessageTime: 0,
          unreadCount: 0,
          isOnline: friend.friend.isOnline || false,
          hasConversation: false,
          isFriend: true
        });
      } else if (friend?.friend?.id) {
        const existing = contactMap.get(friend.friend.id);
        if (existing) {
          existing.isFriend = true;
        }
      }
    });
    
    this.allChatContacts = Array.from(contactMap.values());
    
    this.allChatContacts.sort((a, b) => {
      const timeA = typeof a.lastMessageTime === 'number' ? a.lastMessageTime : 0;
      const timeB = typeof b.lastMessageTime === 'number' ? b.lastMessageTime : 0;
      return timeB - timeA;
    });
  }

  private getSafeTimestamp(date: any): number {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    if (typeof date === 'string') return new Date(date).getTime();
    if (typeof date === 'number') return date;
    return 0;
  }

  // ========== SOCKET ET ÉVÉNEMENTS EN TEMPS RÉEL ==========

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => msg && this.handleNewMessage(msg)),
      this.chatService.typing$.subscribe(data => data && this.handleTyping(data)),
      this.chatService.onlineStatus$.subscribe(data => data && this.handleOnlineStatus(data))
    );
  }

  private handleNewMessage(message: Message): void {
    if (!message) return;
    
    const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
    const cached = this.messagesCache.get(otherUserId) || [];
    cached.push(message);
    this.messagesCache.set(otherUserId, cached);
    
    const content = message.content || (message.type === 'emoji' ? (message.emoji || '') : 'Message');
    this.lastMessagesMap.set(otherUserId, content);
    
    if (message.senderId !== this.currentUserId) {
      const unread = this.unreadCountMap.get(otherUserId) || 0;
      this.unreadCountMap.set(otherUserId, unread + 1);
    }
    
    if (this.selectedContact && (message.senderId === this.selectedContact.userId || message.receiverId === this.selectedContact.userId)) {
      this.messages.push(message);
      this.scrollToBottom();
      if (message.senderId === this.selectedContact.userId) {
        this.chatService.markAsRead(this.selectedContact.userId).subscribe();
        this.unreadCountMap.set(this.selectedContact.userId, 0);
      }
    }
    this.updateContactFromMessage(message);
  }

  private updateContactFromMessage(message: Message): void {
    const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
    let contact = this.allChatContacts.find(c => c.userId === otherUserId);
    if (contact) {
      contact.lastMessage = { 
        content: message.content || (message.type === 'emoji' ? message.emoji : 'Nouveau message'), 
        type: message.type, 
        createdAt: message.createdAt 
      };
      contact.lastMessageTime = this.getSafeTimestamp(message.createdAt);
      contact.hasConversation = true;
      if (message.senderId !== this.currentUserId && (!this.selectedContact || this.selectedContact.userId !== otherUserId)) {
        contact.unreadCount = (contact.unreadCount || 0) + 1;
      }
      this.allChatContacts.sort((a, b) => {
        const timeA = typeof a.lastMessageTime === 'number' ? a.lastMessageTime : 0;
        const timeB = typeof b.lastMessageTime === 'number' ? b.lastMessageTime : 0;
        return timeB - timeA;
      });
    }
  }

  private handleTyping(data: TypingIndicator): void {
    if (data.isTyping) {
      this.typingUsers.add(data.userId);
    } else {
      this.typingUsers.delete(data.userId);
    }
    this.isTyping = this.selectedContact ? this.typingUsers.has(this.selectedContact.userId) : false;
  }

  private handleOnlineStatus(data: { userId: string; isOnline: boolean }): void {
    const contact = this.allChatContacts.find(c => c.userId === data.userId);
    if (contact) contact.isOnline = data.isOnline;
    if (this.selectedContact?.userId === data.userId) {
      this.selectedContact.isOnline = data.isOnline;
    }
  }

  // ========== ENVOI DE MESSAGES ==========

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact?.userId || this.isSending) return;
    this.isSending = true;
    
    const message = { 
      receiverId: this.selectedContact.userId, 
      type: 'text' as const, 
      content: this.newMessage.trim() 
    };
    
    this.chatService.sendMessage(message);
    
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: this.newMessage.trim(),
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    if (this.selectedContact) {
      this.selectedContact.lastMessage = { content: this.newMessage.trim(), type: 'text', createdAt: new Date() };
      this.selectedContact.lastMessageTime = Date.now();
      this.selectedContact.hasConversation = true;
    }
    this.newMessage = '';
    this.isSending = false;
    this.scrollToBottom();
    this.chatService.sendTyping(this.selectedContact.userId, false);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact?.userId) return;
    
    const message = { 
      receiverId: this.selectedContact.userId, 
      type: 'emoji' as const, 
      emoji: emoji 
    };
    
    this.chatService.sendMessage(message);
    
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    if (this.selectedContact) {
      this.selectedContact.lastMessage = { content: emoji, type: 'emoji', createdAt: new Date() };
      this.selectedContact.lastMessageTime = Date.now();
    }
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  sendMoney(): void {
    if (!this.selectedContact?.userId) return;
    const amount = prompt(`Montant à envoyer à ${this.selectedContact.firstName}:`, '1000');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const message = {
        receiverId: this.selectedContact.userId,
        type: 'money' as const,
        moneyTransfer: { amount: Number(amount) }
      };
      this.chatService.sendMessage(message);
      
      const tempMsg: Message = {
        id: 'temp-' + Date.now(),
        senderId: this.currentUserId,
        receiverId: this.selectedContact.userId,
        type: 'money',
        moneyTransfer: { amount: Number(amount), status: 'pending' },
        isRead: false,
        isDelivered: false,
        createdAt: new Date()
      };
      this.messages.push(tempMsg);
      if (this.selectedContact) {
        this.selectedContact.lastMessage = { content: `💰 ${amount} Ar`, type: 'money', createdAt: new Date() };
        this.selectedContact.lastMessageTime = Date.now();
      }
      this.scrollToBottom();
    }
  }

  uploadFile(): void {
    if (!this.selectedContact?.userId) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedContact?.userId) return;
    if (file.size > 150 * 1024 * 1024) {
      this.notificationService.showError('Fichier trop volumineux (max 150 Mo)');
      return;
    }
    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        if (!result.url) return;
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        
        const message = {
          receiverId: this.selectedContact.userId,
          type: type as 'image' | 'file',
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize
        };
        
        this.chatService.sendMessage(message);
        
        const tempMsg: Message = {
          id: 'temp-' + Date.now(),
          senderId: this.currentUserId,
          receiverId: this.selectedContact.userId,
          type: type as 'image' | 'file',
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          isRead: false,
          isDelivered: false,
          createdAt: new Date()
        };
        this.messages.push(tempMsg);
        if (this.selectedContact) {
          this.selectedContact.lastMessage = { content: type === 'image' ? '📷 Image' : `📎 ${result.fileName}`, type: type, createdAt: new Date() };
          this.selectedContact.lastMessageTime = Date.now();
        }
        this.isSending = false;
        this.scrollToBottom();
      },
      error: () => {
        this.notificationService.showError('Erreur upload');
        this.isSending = false;
      }
    });
  }

  // ========== APPELS ==========

  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact?.userId) return;
    if (!this.selectedContact.isOnline) {
      this.notificationService.showWarning('Utilisateur hors ligne');
      return;
    }
    this.chatService.startCall(this.selectedContact.userId, type);
    this.notificationService.showInfo(`Appel ${type} démarré avec ${this.selectedContact.firstName} (simulation)`);
  }

  // ========== GESTION DES AMIS ==========

  checkIfFriend(userId: string): void {
    this.isFriend = this.friends.some(f => f.friend?.id === userId || f.userId === userId);
  }

  sendFriendRequest(): void {
    if (!this.selectedContact) return;
    this.friendService.sendFriendRequest(this.selectedContact.userId).subscribe({
      next: () => this.notificationService.showSuccess('Demande d\'ami envoyée'),
      error: (err) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
  }

  blockUser(): void {
    if (!this.selectedContact) return;
    this.friendService.blockUser(this.selectedContact.userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Utilisateur bloqué');
        this.selectedContact.isBlocked = true;
        this.selectedContact.canMessage = false;
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur lors du blocage');
      }
    });
  }

  // ========== ÉDITION ET SUPPRESSION DE MESSAGES ==========

  editMessage(message: Message): void {
    const newContent = prompt('Modifier le message:', message.content);
    if (newContent && newContent.trim() && newContent !== message.content) {
      this.chatService.updateMessage(message.id, newContent.trim()).subscribe({
        next: (updated) => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index] = updated;
          }
          this.notificationService.showSuccess('Message modifié');
        },
        error: () => {
          this.notificationService.showError('Erreur lors de la modification');
        }
      });
    }
  }

  deleteMessage(message: Message): void {
    if (confirm('Supprimer ce message ?')) {
      this.chatService.deleteMessage(message.id).subscribe({
        next: () => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages.splice(index, 1);
          }
          this.notificationService.showSuccess('Message supprimé');
        },
        error: () => {
          this.notificationService.showError('Erreur lors de la suppression');
        }
      });
    }
  }

  // ========== TYPING ==========

  onTyping(): void {
    if (!this.selectedContact?.userId) return;
    this.chatService.sendTyping(this.selectedContact.userId, true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedContact?.userId) this.chatService.sendTyping(this.selectedContact.userId, false);
    }, 1000);
  }

  // ========== NAVIGATION ==========

  goBack(): void { 
    this.selectedContact = null; 
  }

  goToDashboard(): void { 
    this.router.navigate(['/user']); 
  }

  goToFriends(): void { 
    this.router.navigate(['/friends']); 
  }

  refreshData(): void { 
    this.loadData(); 
  }

  toggleEmojiPicker(): void { 
    this.showEmojiPicker = !this.showEmojiPicker; 
  }

  navigateToSendMoney(): void { 
    this.router.navigate(['/transactions/send']); 
  }

  // ========== UTILITAIRES ==========

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  getAvatarColor(name: string): string {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  formatMessageTime(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 86400000) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  formatLastSeen(date?: Date): string {
    if (!date) return 'Jamais connecté';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return 'En ligne';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  onScroll(event: any): void {
    const element = event.target;
    if (element.scrollTop === 0 && !this.isLoadingMore && this.hasMoreMessages && this.selectedContact) {
      this.loadMoreMessages();
    }
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  handleImageError(msg: Message): void {
    if (msg) {
      msg.fileUrl = undefined;
      msg.type = 'text';
      msg.content = '[Image non disponible]';
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}