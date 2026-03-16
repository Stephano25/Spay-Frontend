import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTabsModule,
    MatTooltipModule
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
  allChatContacts: any[] = [];
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
  activeTab = 0;
  
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
    
    if (!this.currentUserId) {
      console.error('❌ Utilisateur non connecté');
      this.router.navigate(['/login']);
    }
    
    this.chatService.requestNotificationPermission();
  }

  ngOnInit(): void {
    if (this.currentUserId) {
      this.loadData();
      this.setupSocketListeners();
      
      this.route.queryParams.subscribe(params => {
        if (params['friendId']) {
          this.openConversationWithFriend(params['friendId']);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  /**
   * Charger toutes les données (VERSION UNIQUE)
   */
  private loadData(): void {
    this.isLoading = true;
    console.log('🔄 Chargement des données...');
    console.log('👤 Current User ID:', this.currentUserId);
    
    forkJoin({
      conversations: this.chatService.getConversations().pipe(catchError(err => {
        console.error('❌ Erreur conversations:', err);
        return of([]);
      })),
      friends: this.friendService.getFriends().pipe(catchError(err => {
        console.error('❌ Erreur friends:', err);
        return of([]);
      }))
    }).subscribe({
      next: (result) => {
        this.conversations = result.conversations || [];
        this.friends = result.friends || [];
        
        console.log('📋 Conversations chargées:', this.conversations.length);
        console.log('📋 Amis chargés (RAW):', this.friends);
        
        // Afficher les amis en détail
        if (this.friends.length > 0) {
          this.friends.forEach((friend, index) => {
            console.log(`👤 Ami ${index + 1}:`, {
              id: friend.id,
              friendId: friend.friendId,
              userId: friend.userId,
              status: friend.status,
              friendDetails: friend.friend
            });
          });
        } else {
          console.warn('⚠️ Aucun ami trouvé dans la réponse API');
        }
        
        this.mergeContacts();
        this.isLoading = false;
        
        console.log('📋 Contacts fusionnés:', this.allChatContacts.length);
        console.log('📋 Contacts détaillés:', this.allChatContacts);
      },
      error: (error) => {
        console.error('❌ Erreur chargement données:', error);
        this.isLoading = false;
        this.allChatContacts = [];
      }
    });
  }

  /**
   * Fusionner les conversations et les amis
   */
  private mergeContacts(): void {
    const contactMap = new Map();
    
    // 1. Ajouter d'abord les conversations
    this.conversations.forEach(conv => {
      if (conv && conv.userId) {
        console.log('➕ Ajout conversation:', conv.userId, conv.firstName);
        contactMap.set(conv.userId, {
          id: conv.userId,
          userId: conv.userId,
          firstName: conv.firstName || 'Utilisateur',
          lastName: conv.lastName || '',
          profilePicture: conv.profilePicture,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount || 0,
          isOnline: conv.isOnline || false,
          hasConversation: true,
          isFriend: true
        });
      }
    });
    
    // 2. Ajouter les amis qui n'ont pas encore de conversation
    this.friends.forEach(friend => {
      if (friend && friend.friend && friend.friend.id) {
        console.log('➕ Ajout ami:', friend.friend.id, friend.friend.firstName, friend.friend.lastName);
        
        if (!contactMap.has(friend.friend.id)) {
          contactMap.set(friend.friend.id, {
            id: friend.friend.id,
            userId: friend.friend.id,
            firstName: friend.friend.firstName || 'Utilisateur',
            lastName: friend.friend.lastName || '',
            profilePicture: friend.friend.profilePicture,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
            isOnline: friend.friend.isOnline || false,
            hasConversation: false,
            isFriend: true
          });
        } else {
          // Mettre à jour l'ami existant pour s'assurer qu'il est marqué comme ami
          const existing = contactMap.get(friend.friend.id);
          existing.isFriend = true;
          contactMap.set(friend.friend.id, existing);
        }
      }
    });
    
    this.allChatContacts = Array.from(contactMap.values());
    
    // Trier par date du dernier message (les plus récents en premier)
    this.allChatContacts.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
    
    console.log('✅ Contacts fusionnés:', this.allChatContacts.length);
  }

  /**
   * Charger les messages avec un contact
   */
  loadMessages(userId: string): void {
    if (!userId) {
      console.error('❌ Tentative de chargement avec userId undefined');
      this.notificationService.showError('Erreur: utilisateur inconnu');
      return;
    }

    this.isLoading = true;
    this.messages = [];
    this.messagePage = 1;
    this.hasMoreMessages = true;
    
    this.subscriptions.push(
      this.chatService.getMessages(userId).subscribe({
        next: (messages) => {
          this.messages = messages || [];
          this.isLoading = false;
          
          // Marquer comme lus
          this.chatService.markAsRead(userId).subscribe();
          
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('❌ Erreur chargement messages:', error);
          this.isLoading = false;
          this.notificationService.showError('Erreur lors du chargement des messages');
        }
      })
    );
  }

  /**
   * Sélectionner un contact
   */
  selectContact(contact: any): void {
    if (!contact || !contact.userId) {
      console.error('❌ Tentative de sélection avec contact invalide:', contact);
      return;
    }
    
    console.log('👤 Contact sélectionné:', contact);
    this.selectedContact = contact;
    this.loadMessages(contact.userId);
    
    // Mettre à jour le statut en ligne
    const friend = this.friends.find(f => f.friend?.id === contact.userId);
    if (friend) {
      contact.isOnline = friend.friend?.isOnline || false;
    }
  }

  /**
   * Ouvrir une conversation avec un ami
   */
  openConversationWithFriend(friendId: string): void {
    if (!friendId) {
      console.error('❌ friendId undefined');
      return;
    }
    
    const contact = this.allChatContacts.find(c => c.userId === friendId);
    if (contact) {
      this.selectContact(contact);
    } else {
      this.notificationService.showInfo('Cet utilisateur n\'est pas dans votre liste d\'amis');
      this.router.navigate(['/friends']);
    }
  }

  /**
   * Configurer les listeners socket
   */
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
   * Gérer un nouveau message
   */
  private handleNewMessage(message: Message): void {
    console.log('📨 Nouveau message reçu:', message);
    
    if (!message || !message.senderId) return;
    
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
    if (!message || !message.senderId || !message.receiverId) return;
    
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
    if (!data || !data.userId) return;
    
    if (data.isTyping) {
      this.typingUsers.add(data.userId);
    } else {
      this.typingUsers.delete(data.userId);
    }

    this.isTyping = this.selectedContact ? 
      this.typingUsers.has(this.selectedContact.userId) : false;
  }

  private handleOnlineStatus(data: { userId: string; isOnline: boolean }): void {
    if (!data || !data.userId) return;
    
    const contact = this.allChatContacts.find(c => c.userId === data.userId);
    if (contact) {
      contact.isOnline = data.isOnline;
    }

    if (this.selectedContact?.userId === data.userId) {
      this.selectedContact.isOnline = data.isOnline;
    }
  }

  /**
   * Envoyer un message
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact || !this.selectedContact.userId || this.isSending) return;

    this.isSending = true;
    
    const message = {
      receiverId: this.selectedContact.userId,
      type: 'text' as const,
      content: this.newMessage.trim()
    };

    this.chatService.sendMessage(message);
    
    // Message temporaire
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
    if (this.selectedContact) {
      this.selectedContact.lastMessage = {
        content: this.newMessage.trim(),
        type: 'text',
        createdAt: new Date()
      };
      this.selectedContact.lastMessageTime = new Date();
      this.selectedContact.hasConversation = true;
    }
    
    this.newMessage = '';
    this.isSending = false;
    this.scrollToBottom();
    
    this.chatService.sendTyping(this.selectedContact.userId, false);
  }

  /**
   * Gérer le scroll pour la pagination
   */
  onScroll(event: any): void {
    if (!this.messageContainer || !this.messageContainer.nativeElement) return;
    
    const container = this.messageContainer.nativeElement;
    if (container.scrollTop < 50 && this.hasMoreMessages && !this.isLoadingMore) {
      this.loadMoreMessages();
    }
  }

  /**
   * Charger plus de messages (pagination)
   */
  loadMoreMessages(): void {
    if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return;
    
    this.isLoadingMore = true;
    this.messagePage++;
    
    // Simulation de chargement - à remplacer par un vrai appel API
    setTimeout(() => {
      this.isLoadingMore = false;
      if (this.messagePage > 3) {
        this.hasMoreMessages = false;
      }
    }, 1000);
  }

  /**
   * Ouvrir une image dans un nouvel onglet
   */
  openImage(imageUrl: string | undefined | null): void {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }

  // Filtrer les contacts
  get filteredContacts(): any[] {
    if (!this.allChatContacts || this.allChatContacts.length === 0) return [];
    
    if (!this.searchQuery.trim()) {
      return this.allChatContacts;
    }
    const query = this.searchQuery.toLowerCase();
    return this.allChatContacts.filter(contact => 
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query)
    );
  }

  get displayedContacts(): any[] {
    const filtered = this.filteredContacts;
    
    switch(this.activeTab) {
      case 1: // Amis
        return filtered.filter(c => c.isFriend);
      case 2: // Conversations
        return filtered.filter(c => c.hasConversation);
      default: // Tous
        return filtered;
    }
  }

  // Méthodes utilitaires
  sendEmoji(emoji: string): void {
    if (!this.selectedContact || !this.selectedContact.userId) return;

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
    
    if (this.selectedContact) {
      this.selectedContact.lastMessage = {
        content: emoji,
        type: 'emoji',
        createdAt: new Date()
      };
      this.selectedContact.lastMessageTime = new Date();
    }
    
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  sendMoney(): void {
    if (!this.selectedContact || !this.selectedContact.userId) return;

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
    if (!this.selectedContact || !this.selectedContact.userId) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedContact || !this.selectedContact.userId) return;

    if (file.size > 150 * 1024 * 1024) {
      this.notificationService.showError('Fichier trop volumineux (max 150 Mo)');
      return;
    }

    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        if (!result || !result.url) return;
        
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
        console.error('❌ Erreur upload:', error);
        this.notificationService.showError('Erreur lors de l\'upload');
        this.isSending = false;
      }
    });
  }

  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact || !this.selectedContact.userId) return;

    if (!this.selectedContact.isOnline) {
      this.notificationService.showWarning('Cet utilisateur n\'est pas en ligne');
      return;
    }

    this.notificationService.showInfo(`Appel ${type} démarré avec ${this.selectedContact.firstName} (simulation)`);
  }

  onTyping(): void {
    if (!this.selectedContact || !this.selectedContact.userId) return;

    this.chatService.sendTyping(this.selectedContact.userId, true);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedContact && this.selectedContact.userId) {
        this.chatService.sendTyping(this.selectedContact.userId, false);
      }
    }, 1000);
  }

  formatMessageTime(date: Date): string {
    if (!date) return '';
    
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
    if (!firstName && !lastName) return '?';
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  getAvatarColor(name: string): string {
    if (!name) return '#667eea';
    
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
        if (this.messageContainer && this.messageContainer.nativeElement) {
          this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }
      } catch (err) {}
    }, 100);
  }

  goBack(): void {
    this.selectedContact = null;
  }

  getFriendsCount(): number {
    return this.allChatContacts?.filter(c => c.isFriend).length || 0;
  }

  getConversationsCount(): number {
    return this.allChatContacts?.filter(c => c.hasConversation).length || 0;
  }

  getFriendsContacts(): any[] {
    return this.filteredContacts?.filter(c => c.isFriend) || [];
  }

  getConversationsContacts(): any[] {
    return this.filteredContacts?.filter(c => c.hasConversation) || [];
  }

  handleImageError(message: Message): void {
    if (message) {
      message.fileUrl = undefined;
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  navigateToSendMoney(): void {
    if (this.selectedContact && this.selectedContact.userId) {
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

  goToFriends(): void {
    this.router.navigate(['/friends']);
  }

  refreshData(): void {
    this.loadData();
  }

  /**
  * Retourner au tableau de bord
  */
  goToDashboard(): void {
    this.router.navigate(['/user']);
  }

  /**
  * Bloquer un utilisateur
  */
  blockUser(): void {
    if (this.selectedContact && confirm(`Voulez-vous vraiment bloquer ${this.selectedContact.firstName} ?`)) {
      // Implémenter la logique de blocage
      this.notificationService.showInfo(`${this.selectedContact.firstName} a été bloqué`);
    }
  }

  /**
  * Modifier un message
  */
  editMessage(message: Message): void {
    const newContent = prompt('Modifier votre message:', message.content);
    if (newContent && newContent.trim()) {
      // Appel API pour modifier le message
      this.chatService.updateMessage(message.id, newContent.trim()).subscribe({
        next: (updatedMessage) => {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index] = updatedMessage;
          }
          this.notificationService.showSuccess('Message modifié');
        },
        error: (error) => {
          console.error('Erreur modification:', error);
          this.notificationService.showError('Erreur lors de la modification');
        }
      });
    }
  }

  /**
  * Supprimer un message
  */
  deleteMessage(message: Message): void {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
      this.chatService.deleteMessage(message.id).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== message.id);
          this.notificationService.showSuccess('Message supprimé');
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
          this.notificationService.showError('Erreur lors de la suppression');
        }
      });
    }
  }
}