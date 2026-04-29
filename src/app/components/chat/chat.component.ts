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
import { Friend, FriendRequest } from '../../models/friend.model';

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

  // Données des amis
  friends: Friend[] = [];
  friendRequests: FriendRequest[] = [];
  
  // Listes pour l'affichage
  allFriendsList: any[] = [];
  onlineFriendsList: any[] = [];
  filteredFriendsList: any[] = [];
  pendingRequests: any[] = [];
  
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedContact: any = null;
  currentUserId: string = '';
  isFriend: boolean = false;

  // États UI
  newMessage = '';
  isLoading = true;
  isLoadingFriends: boolean = false;
  isLoadingMessages = false;
  isSending = false;
  isTyping = false;
  typingTimeout: any;
  showEmojiPicker = false;
  searchQuery = '';
  isLoadingMore = false;
  hasMoreMessages = true;
  messagePage = 1;
  pageSize = 20;
  
  // États des menus dépliables
  showFriendsList: boolean = true;
  showRequestsList: boolean = true;

  private subscriptions: Subscription[] = [];
  private typingUsers: Set<string> = new Set();
  private messagesCache: Map<string, Message[]> = new Map();
  private pendingTempMessages: Map<string, string> = new Map(); // Pour suivre les messages temporaires

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
          setTimeout(() => {
            const friend = this.allFriendsList.find(f => f.userId === params['friendId']);
            if (friend) {
              this.selectFriendFromList(friend);
            }
          }, 1000);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
    this.pendingTempMessages.clear();
  }

  // ========== MÉTHODES DE TOGGLE ==========

  toggleFriendsList(): void {
    this.showFriendsList = !this.showFriendsList;
  }

  toggleRequestsList(): void {
    this.showRequestsList = !this.showRequestsList;
  }

  // ========== CHARGEMENT DES DONNÉES ==========

  private loadData(): void {
    this.isLoading = true;
    this.isLoadingFriends = true;
    console.log('Chargement des données...');
    
    forkJoin({
      friends: this.friendService.getFriends().pipe(catchError(error => {
        console.error('Erreur chargement amis:', error);
        return of([]);
      })),
      requests: this.friendService.getFriendRequests().pipe(catchError(error => {
        console.error('Erreur chargement demandes:', error);
        return of([]);
      }))
    }).subscribe({
      next: (result) => {
        console.log('Amis reçus:', result.friends);
        console.log('Demandes reçues:', result.requests);
        
        if (result.friends.length > 0) {
          console.log('Structure du premier ami:', JSON.stringify(result.friends[0], null, 2));
        }
        
        this.friends = result.friends.filter(f => f.status === 'accepted');
        this.friendRequests = result.requests;
        
        this.buildFriendsLists();
        
        this.isLoading = false;
        this.isLoadingFriends = false;
        console.log('Liste des amis construite:', this.allFriendsList);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
        this.isLoadingFriends = false;
        this.allFriendsList = [];
        this.onlineFriendsList = [];
      }
    });
  }

  private buildFriendsLists(): void {
    this.allFriendsList = this.friends.map((friend, index) => {
      let friendUserId = '';
      
      if (friend.friendId) {
        friendUserId = friend.friendId;
      } else if (friend.friend?.id) {
        friendUserId = friend.friend.id;
      }
      
      if (!friendUserId) {
        console.warn('Ami sans ID valide ignoré:', friend);
        return null;
      }
      
      const friendData = friend.friend;
      
      return {
        trackId: `friend-${index}-${friendUserId}`,
        userId: friendUserId,
        firstName: friendData?.firstName || 'Utilisateur',
        lastName: friendData?.lastName || '',
        profilePicture: friendData?.profilePicture || '',
        isOnline: friendData?.isOnline || false,
        lastSeen: friendData?.lastSeen
      };
    }).filter(friend => friend !== null);
    
    this.onlineFriendsList = this.allFriendsList.filter(f => f.isOnline === true);
    this.filteredFriendsList = [...this.allFriendsList];
    
    this.pendingRequests = this.friendRequests.map((request, index) => ({
      id: request.id || `req-${index}`,
      senderFirstName: request.sender?.firstName || 'Utilisateur',
      senderLastName: request.sender?.lastName || '',
      senderEmail: request.sender?.email || ''
    }));
    
    console.log('Amis en ligne:', this.onlineFriendsList.length);
    console.log('Total amis valides:', this.allFriendsList.length);
  }

  // ========== RECHERCHE ==========

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFriendsList = [...this.allFriendsList];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredFriendsList = this.allFriendsList.filter(friend => 
        (friend.firstName?.toLowerCase() || '').includes(query) ||
        (friend.lastName?.toLowerCase() || '').includes(query) ||
        `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(query)
      );
    }
  }

  // ========== SÉLECTION DES CONTACTS ==========

  selectFriendFromList(friend: any): void {
    if (!friend?.userId) {
      console.error('ID ami invalide:', friend);
      this.notificationService.showError('Impossible de sélectionner cet ami');
      return;
    }
    
    console.log('Sélection de l\'ami:', friend);
    
    this.selectedContact = {
      userId: friend.userId,
      firstName: friend.firstName,
      lastName: friend.lastName,
      profilePicture: friend.profilePicture,
      isOnline: friend.isOnline,
      lastSeen: friend.lastSeen
    };
    
    this.loadMessages(friend.userId);
    this.isFriend = true;
    this.chatService.markAsRead(friend.userId).subscribe();
  }

  // ========== GESTION DES DEMANDES D'AMI ==========

  acceptFriendRequest(requestId: string): void {
    this.friendService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Demande acceptée');
        this.loadData();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur');
      }
    });
  }

  declineFriendRequest(requestId: string): void {
    this.friendService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.showInfo('Demande refusée');
        this.loadData();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur');
      }
    });
  }

  // ========== GESTION DES MESSAGES ==========

  loadMessages(userId: string): void {
    if (!userId || userId === '') {
      console.error('ID utilisateur invalide:', userId);
      this.notificationService.showError('ID utilisateur invalide');
      this.isLoadingMessages = false;
      return;
    }
    
    const cached = this.messagesCache.get(userId);
    if (cached && this.selectedContact?.userId === userId) {
      this.messages = [...cached];
      this.scrollToBottom();
      return;
    }
    
    this.isLoadingMessages = true;
    this.messages = [];
    this.messagePage = 1;
    this.hasMoreMessages = true;
    
    this.chatService.getMessages(userId).subscribe({
      next: (msgs) => {
        // Filtrer les messages temporaires et supprimer les doublons
        let validMessages = (msgs || []).filter(m => !m.id.startsWith('temp-'));
        const uniqueMap = new Map<string, Message>();
        validMessages.forEach(msg => uniqueMap.set(msg.id, msg));
        validMessages = Array.from(uniqueMap.values());
        validMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        this.messages = validMessages;
        this.messagesCache.set(userId, [...this.messages]);
        this.isLoadingMessages = false;
        this.chatService.markAsRead(userId).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages = false;
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
            const existingIds = new Set(this.messages.map(m => m.id));
            const newMessages = oldMessages.filter(m => !existingIds.has(m.id) && !m.id.startsWith('temp-'));
            
            if (newMessages.length > 0) {
              this.messages = [...newMessages, ...this.messages];
              this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              this.messagesCache.set(this.selectedContact.userId, [...this.messages]);
            }
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

  // ========== SOCKET ==========

  private setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => msg && this.handleNewMessage(msg)),
      this.chatService.typing$.subscribe(data => data && this.handleTyping(data)),
      this.chatService.onlineStatus$.subscribe(data => data && this.handleOnlineStatus(data))
    );
  }

  private handleNewMessage(message: Message): void {
    if (!message) return;
    
    // 🔥 IMPORTANT: Ignorer les messages envoyés par l'utilisateur courant
    // Ces messages sont déjà affichés via le message temporaire dans sendMessage()
    if (message.senderId === this.currentUserId) {
      console.log('Message envoyé par moi-même, mise à jour du temporaire:', message.id);
      
      // Remplacer le message temporaire par le vrai message
      const tempIndex = this.messages.findIndex(m => 
        m.id.startsWith('temp-') && 
        m.content === message.content && 
        m.senderId === this.currentUserId
      );
      
      if (tempIndex !== -1) {
        // Remplacer le message temporaire
        this.messages[tempIndex] = message;
        
        // Mettre à jour le cache
        const cached = this.messagesCache.get(message.receiverId) || [];
        const cacheIndex = cached.findIndex(m => m.id.startsWith('temp-') && m.content === message.content);
        if (cacheIndex !== -1) {
          cached[cacheIndex] = message;
          this.messagesCache.set(message.receiverId, cached);
        }
        
        // Trier les messages par date
        this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.scrollToBottom();
      }
      return;
    }
    
    // Pour les messages des autres utilisateurs, vérifier les doublons
    const messageExists = this.messages.some(m => m.id === message.id);
    if (messageExists) {
      console.log('Message déjà existant, ignoré:', message.id);
      return;
    }
    
    const otherUserId = message.senderId;
    
    // Ajouter au cache
    const cached = this.messagesCache.get(otherUserId) || [];
    cached.push(message);
    cached.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    this.messagesCache.set(otherUserId, cached);
    
    // Ajouter à l'affichage si c'est la conversation ouverte
    if (this.selectedContact && this.selectedContact.userId === otherUserId) {
      this.messages.push(message);
      this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      this.scrollToBottom();
      this.chatService.markAsRead(otherUserId).subscribe();
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
    const friend = this.allFriendsList.find(f => f.userId === data.userId);
    if (friend) friend.isOnline = data.isOnline;
    if (this.selectedContact?.userId === data.userId) {
      this.selectedContact.isOnline = data.isOnline;
    }
    this.onlineFriendsList = this.allFriendsList.filter(f => f.isOnline === true);
  }

  // ========== ENVOI DE MESSAGES ==========

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact?.userId || this.isSending) return;
    this.isSending = true;
    
    const messageContent = this.newMessage.trim();
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    
    // Créer un message temporaire
    const tempMsg: Message = {
      id: tempId,
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: messageContent,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    
    // Ajouter le message temporaire à l'affichage
    this.messages.push(tempMsg);
    this.scrollToBottom();
    
    // Mettre à jour le dernier message du contact
    if (this.selectedContact) {
      this.selectedContact.lastMessage = messageContent;
      this.selectedContact.lastMessageTime = Date.now();
      this.selectedContact.hasConversation = true;
    }
    
    // Envoyer via socket
    const message = { 
      receiverId: this.selectedContact.userId, 
      type: 'text' as const, 
      content: messageContent 
    };
    this.chatService.sendMessage(message);
    
    this.newMessage = '';
    this.isSending = false;
    this.chatService.sendTyping(this.selectedContact.userId, false);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact?.userId) return;
    
    const tempId = 'temp-emoji-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    
    const message = { 
      receiverId: this.selectedContact.userId, 
      type: 'emoji' as const, 
      emoji: emoji 
    };
    this.chatService.sendMessage(message);
    
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  sendMoney(): void {
    if (!this.selectedContact?.userId) return;
    const amount = prompt(`Montant à envoyer à ${this.selectedContact.firstName}:`, '1000');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const tempId = 'temp-money-' + Date.now();
      const tempMsg: Message = {
        id: tempId,
        senderId: this.currentUserId,
        receiverId: this.selectedContact.userId,
        type: 'money',
        moneyTransfer: { amount: Number(amount), status: 'pending' },
        isRead: false,
        isDelivered: false,
        createdAt: new Date()
      };
      this.messages.push(tempMsg);
      
      const message = {
        receiverId: this.selectedContact.userId,
        type: 'money' as const,
        moneyTransfer: { amount: Number(amount) }
      };
      this.chatService.sendMessage(message);
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
        
        const tempId = 'temp-file-' + Date.now();
        const tempMsg: Message = {
          id: tempId,
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
        
        const message = {
          receiverId: this.selectedContact.userId,
          type: type as 'image' | 'file',
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize
        };
        
        this.chatService.sendMessage(message);
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
    this.notificationService.showInfo(`Appel ${type} démarré avec ${this.selectedContact.firstName}`);
  }

  // ========== GESTION DES AMIS ==========

  blockUser(): void {
    if (!this.selectedContact) return;
    this.friendService.blockUser(this.selectedContact.userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Utilisateur bloqué');
        this.selectedContact.isBlocked = true;
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur lors du blocage');
      }
    });
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

  viewFriendProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  sendMoneyToFriend(userId: string, firstName: string): void {
    this.router.navigate(['/transactions/send'], { queryParams: { friendId: userId, friendName: firstName } });
  }

  refreshData(): void { 
    this.loadData(); 
  }

  toggleEmojiPicker(): void { 
    this.showEmojiPicker = !this.showEmojiPicker; 
  }

  // ========== ÉDITION ET SUPPRESSION ==========

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