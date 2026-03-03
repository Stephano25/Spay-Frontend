import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { ChatService, Message, Conversation, TypingIndicator } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';

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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

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
    MatDialogModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Données
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  currentUserId: string = '';
  
  // UI
  newMessage = '';
  isLoading = true;
  isSending = false;
  isTyping = false;
  typingTimeout: any;
  showEmojiPicker = false;
  
  // Pagination
  messagePage = 1;
  hasMoreMessages = true;
  isLoadingMore = false;

  private subscriptions: Subscription[] = [];
  private typingUsers: Set<string> = new Set();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    
    // Demander la permission de notification
    this.chatService.requestNotificationPermission();
  }

  ngOnInit(): void {
    this.loadConversations();
    this.setupSocketListeners();
    
    // Vérifier s'il y a un friendId dans l'URL
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
   * Ouvrir une image en grand
   */
  openImage(imageUrl: string | undefined | null): void {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }

  /**
   * Configurer les écouteurs socket
   */
  private setupSocketListeners(): void {
    // Nouveau message
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(message => {
        if (message) {
          this.handleNewMessage(message);
        }
      })
    );

    // Indicateur de frappe
    this.subscriptions.push(
      this.chatService.typing$.subscribe(data => {
        if (data) {
          this.handleTyping(data);
        }
      })
    );

    // Statut en ligne
    this.subscriptions.push(
      this.chatService.onlineStatus$.subscribe(data => {
        if (data) {
          this.handleOnlineStatus(data);
        }
      })
    );

    // Signal d'appel
    this.subscriptions.push(
      this.chatService.callSignal$.subscribe(signal => {
        if (signal) {
          this.handleIncomingCall(signal);
        }
      })
    );
  }

  /**
   * Charger les conversations
   */
  private loadConversations(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.chatService.getConversations().subscribe({
        next: (data) => {
          this.conversations = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement conversations:', error);
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * Charger les messages d'une conversation
   */
  loadMessages(userId: string, reset: boolean = true): void {
    if (reset) {
      this.messages = [];
      this.messagePage = 1;
      this.hasMoreMessages = true;
    }

    this.isLoadingMore = true;
    this.subscriptions.push(
      this.chatService.getMessages(userId).subscribe({
        next: (messages) => {
          this.messages = messages.reverse();
          this.isLoadingMore = false;
          
          // Marquer comme lus
          this.chatService.markAsRead(userId).subscribe();
          
          // Scroll en bas
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Erreur chargement messages:', error);
          this.isLoadingMore = false;
        }
      })
    );
  }

  /**
   * Sélectionner une conversation
   */
  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.userId);
  }

  /**
   * Ouvrir une conversation avec un ami spécifique
   */
  openConversationWithFriend(friendId: string): void {
    const conversation = this.conversations.find(c => c.userId === friendId);
    if (conversation) {
      this.selectConversation(conversation);
    } else {
      // Créer une nouvelle conversation
      this.loadFriendInfo(friendId);
    }
  }

  /**
   * Charger les informations d'un ami pour créer une conversation
   */
  private loadFriendInfo(friendId: string): void {
    this.chatService.searchUsers(friendId).subscribe(users => {
      const user = users[0];
      if (user) {
        const newConversation: Conversation = {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          lastMessage: {} as Message,
          lastMessageTime: new Date(),
          unreadCount: 0,
          isOnline: false
        };
        this.conversations.unshift(newConversation);
        this.selectConversation(newConversation);
      }
    });
  }

  /**
   * Gérer un nouveau message
   */
  private handleNewMessage(message: Message): void {
    // Ajouter aux messages si c'est la conversation active
    if (this.selectedConversation && 
        (message.senderId === this.selectedConversation.userId || 
         message.receiverId === this.selectedConversation.userId)) {
      this.messages.push(message);
      this.scrollToBottom();
      
      // Marquer comme lu
      if (message.senderId === this.selectedConversation.userId) {
        this.chatService.markAsRead(this.selectedConversation.userId).subscribe();
      }
    }

    // Mettre à jour la conversation
    this.updateConversation(message);
  }

  /**
   * Mettre à jour une conversation avec un nouveau message
   */
  private updateConversation(message: Message): void {
    const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
    const conversation = this.conversations.find(c => c.userId === otherUserId);

    if (conversation) {
      conversation.lastMessage = message;
      conversation.lastMessageTime = message.createdAt;
      if (message.senderId !== this.currentUserId && 
          (!this.selectedConversation || this.selectedConversation.userId !== otherUserId)) {
        conversation.unreadCount++;
      }
    }
  }

  /**
   * Gérer l'indicateur de frappe
   */
  private handleTyping(data: TypingIndicator): void {
    if (data.isTyping) {
      this.typingUsers.add(data.userId);
    } else {
      this.typingUsers.delete(data.userId);
    }

    if (this.selectedConversation && this.typingUsers.has(this.selectedConversation.userId)) {
      this.isTyping = true;
    } else {
      this.isTyping = false;
    }
  }

  /**
   * Gérer le changement de statut en ligne
   */
  private handleOnlineStatus(data: { userId: string; isOnline: boolean; lastSeen?: Date }): void {
    const conversation = this.conversations.find(c => c.userId === data.userId);
    if (conversation) {
      conversation.isOnline = data.isOnline;
      conversation.lastSeen = data.lastSeen;
    }

    if (this.selectedConversation?.userId === data.userId) {
      this.selectedConversation.isOnline = data.isOnline;
      this.selectedConversation.lastSeen = data.lastSeen;
    }
  }

  /**
   * Gérer un appel entrant
   */
  private handleIncomingCall(signal: any): void {
    console.log('Appel entrant:', signal);
    // À implémenter
  }

  /**
   * Envoyer un message
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.isSending) return;

    this.isSending = true;
    
    const message = {
      receiverId: this.selectedConversation.userId,
      type: 'text' as const,
      content: this.newMessage.trim()
    };

    this.chatService.sendMessage(message);
    this.newMessage = '';
    this.isSending = false;
    
    // Arrêter l'indicateur de frappe
    this.chatService.sendTyping(this.selectedConversation.userId, false);
  }

  /**
   * Envoyer un emoji
   */
  sendEmoji(emoji: string): void {
    if (!this.selectedConversation) return;

    const message = {
      receiverId: this.selectedConversation.userId,
      type: 'emoji' as const,
      emoji: emoji
    };

    this.chatService.sendMessage(message);
    this.showEmojiPicker = false;
  }

  /**
   * Envoyer un transfert d'argent
   */
  sendMoney(): void {
    if (!this.selectedConversation) return;

    const amount = prompt(`Montant à envoyer à ${this.selectedConversation.firstName}:`, '1000');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const message = {
        receiverId: this.selectedConversation!.userId,
        type: 'money' as const,
        moneyTransfer: {
          amount: Number(amount),
          status: 'pending'
        }
      };
      this.chatService.sendMessage(message);
    }
  }

  /**
   * Uploader un fichier
   */
  uploadFile(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Gérer la sélection de fichier
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedConversation) return;

    if (file.size > 150 * 1024 * 1024) {
      this.notificationService.showError('Fichier trop volumineux (max 150 Mo)');
      return;
    }

    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const message = {
          receiverId: this.selectedConversation!.userId,
          type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
          fileUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize
        };
        this.chatService.sendMessage(message);
        this.isSending = false;
      },
      error: (error) => {
        console.error('Erreur upload:', error);
        this.notificationService.showError('Erreur lors de l\'upload');
        this.isSending = false;
      }
    });
  }

  /**
   * Démarrer un appel
   */
  startCall(type: 'video' | 'audio'): void {
    if (!this.selectedConversation) return;

    if (!this.selectedConversation.isOnline) {
      this.notificationService.showWarning('Cet utilisateur n\'est pas en ligne');
      return;
    }

    this.chatService.startCall(this.selectedConversation.userId, type);
  }

  /**
   * Gérer la frappe
   */
  onTyping(): void {
    if (!this.selectedConversation) return;

    this.chatService.sendTyping(this.selectedConversation.userId, true);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedConversation) {
        this.chatService.sendTyping(this.selectedConversation.userId, false);
      }
    }, 1000);
  }

  /**
   * Formater la date du message
   */
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

  /**
   * Formater la dernière connexion
   */
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

  /**
   * Obtenir les initiales
   */
  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  /**
   * Obtenir la couleur de l'avatar
   */
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

  /**
   * Scroll vers le bas
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }, 100);
  }

  /**
   * Naviguer vers l'envoi d'argent
   */
  navigateToSendMoney(): void {
    if (this.selectedConversation) {
      this.router.navigate(['/transactions/send'], {
        queryParams: {
          friendId: this.selectedConversation.userId,
          friendName: `${this.selectedConversation.firstName} ${this.selectedConversation.lastName}`
        }
      });
    } else {
      this.router.navigate(['/transactions/send']);
    }
  }
}