// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService, Message, Conversation } from '../../services/chat.service';
import { Friend, FriendService, SearchUser } from '../../services/friend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfigService } from '../../services/config.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('editInput') editInput!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedContact: Conversation | null = null;
  currentUserId = '';
  newMessage = '';
  isTyping = false;
  typingTimeout: any;
  
  // Gestion des amis
  allFriends: Friend[] = [];
  onlineFriends: Friend[] = [];
  
  searchQuery = '';
  showEmojiPicker = false;
  isSending = false;
  isVoiceSupported = 'MediaRecorder' in window || 'webkitSpeechRecognition' in window;

  showNewConversation = false;
  newConversationQuery = '';
  newConversationResults: SearchUser[] = [];
  isSearchingUsers = false;

  activeMessageId: string | null = null;
  activeReactionPickerId: string | null = null;
  quickReactions = ['👍', '❤️', '😆', '😮', '😢', '🙏'];

  editingMessageId: string | null = null;
  editContent = '';

  showTransferPanel = false;
  transferAmount: number | null = null;
  transferQuickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  private subscriptions: Subscription[] = [];

  emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
    '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏',
    '😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠',
    '😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥',
    '😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
    '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','👻','👽',
    '🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌',
    '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜',
    '🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️','🗣️','👤','👥',
    '👣','🧠','🩸','🩻','💪','🦵','🦶','👂','🦻','👃','👀','🧬','🦷','👅','👄','💋'
  ];

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.loadConversations();
    this.loadAllFriends();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  getFileUrl(fileUrl?: string): string {
    return this.configService.getFileUrl(fileUrl);
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (convs) => {
        this.conversations = convs.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        this.updateConversationsOnlineStatus();
      },
      error: (err) => console.error('Erreur chargement conversations', err)
    });
  }

  loadAllFriends(): void {
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.allFriends = friends.filter(f => f.status === 'accepted');
        this.updateOnlineFriends();
        this.updateConversationsOnlineStatus();
        console.log(`👥 ${this.allFriends.length} amis chargés`);
        console.log('📋 allFriends:', this.allFriends.map(f => ({ 
          id: f.friend?.id, 
          name: `${f.friend?.firstName} ${f.friend?.lastName}`,
          online: f.friend?.isOnline
        })));
      },
      error: (err) => console.error('Erreur chargement amis', err)
    });
  }

  updateOnlineFriends(): void {
    this.onlineFriends = this.allFriends.filter(f => f.friend?.isOnline === true);
    console.log(`🟢 ${this.onlineFriends.length} amis en ligne`);
    console.log('📋 onlineFriends:', this.onlineFriends.map(f => ({ 
      id: f.friend?.id, 
      name: `${f.friend?.firstName} ${f.friend?.lastName}`
    })));
  }

  updateConversationsOnlineStatus(): void {
    this.conversations.forEach(conv => {
      const friend = this.allFriends.find(f => f.friend?.id === conv.userId);
      if (friend && friend.friend) {
        conv.isOnline = friend.friend.isOnline || false;
      }
    });
  }

  // ============================================================
  // SOCKET LISTENERS
  // ============================================================

  setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => {
        console.log('📩 NewMessage reçu dans component:', msg);
        msg && this.handleNewMessage(msg);
      }),
      
      this.chatService.typing$.subscribe(data => {
        console.log('📝 Typing reçu dans component:', data);
        if (data && this.selectedContact && data.userId === this.selectedContact.userId) {
          this.isTyping = data.isTyping;
        }
      }),
      
      this.chatService.onlineStatus$.subscribe(data => {
        console.log('📡 Événement onlineStatus reçu dans component:', data);
        if (!data) return;
        
        console.log(`🔄 Statut en ligne: ${data.userId} -> ${data.isOnline ? '🟢 EN LIGNE' : '🔴 HORS LIGNE'}`);
        
        // Mettre à jour dans allFriends
        const friend = this.allFriends.find(f => f.friend?.id === data.userId);
        if (friend && friend.friend) {
          console.log(`✅ Mise à jour de l'ami ${friend.friend.firstName} ${friend.friend.lastName}: ${data.isOnline ? '🟢' : '🔴'}`);
          friend.friend.isOnline = data.isOnline;
        } else {
          console.warn(`⚠️ Ami non trouvé dans allFriends: ${data.userId}`);
          console.log('📋 allFriends IDs:', this.allFriends.map(f => f.friend?.id));
        }
        
        // Mettre à jour dans onlineFriends
        this.updateOnlineFriends();
        
        // Mettre à jour dans les conversations
        const conv = this.conversations.find(c => c.userId === data.userId);
        if (conv) {
          conv.isOnline = data.isOnline;
        }
        
        // Mettre à jour le contact sélectionné
        if (this.selectedContact?.userId === data.userId) {
          this.selectedContact.isOnline = data.isOnline;
        }
      }),
      
      this.chatService.messageEdited$.subscribe(msg => {
        console.log('✏️ Message édité reçu:', msg);
        this.applyMessageUpdate(msg);
      }),
      
      this.chatService.messageReaction$.subscribe(msg => {
        console.log('😊 Réaction reçue:', msg);
        this.applyMessageUpdate(msg);
      }),
      
      this.chatService.messageDeleted$.subscribe(data => {
        console.log('🗑️ Message supprimé reçu:', data);
        this.applyMessageDeleted(data.messageId);
      }),
      
      this.chatService.messageBlocked$.subscribe(() => {
        this.notificationService.showWarning('Vous ne pouvez pas écrire à cet utilisateur');
      })
    );
  }

  // ============================================================
  // GESTION DES MESSAGES
  // ============================================================

  handleNewMessage(message: Message): void {
    console.log('📩 handleNewMessage:', message);
    if (this.selectedContact && message.senderId === this.selectedContact.userId) {
      this.messages.push(message);
      this.scrollToBottom();
      this.chatService.markAsRead(this.selectedContact.userId).subscribe();
    }
    let conv = this.conversations.find(c => c.userId === message.senderId);
    if (conv) {
      conv.lastMessage = { content: message.content || '', type: message.type, createdAt: message.createdAt };
      conv.lastMessageTime = message.createdAt;
      if (!this.selectedContact || this.selectedContact.userId !== message.senderId) conv.unreadCount++;
    } else if (message.sender) {
      conv = {
        userId: message.senderId,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profilePicture: message.sender.profilePicture,
        lastMessage: { content: message.content || '', type: message.type, createdAt: message.createdAt },
        lastMessageTime: message.createdAt,
        unreadCount: 1,
        isOnline: true
      };
      this.conversations.unshift(conv);
    }
    this.conversations.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  selectConversation(conv: Conversation): void {
    this.selectedContact = conv;
    this.messages = [];
    this.closeAllPanels();
    this.chatService.getMessages(conv.userId).subscribe({
      next: (msgs) => {
        this.messages = msgs.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.scrollToBottom();
        this.chatService.markAsRead(conv.userId).subscribe();
        conv.unreadCount = 0;
      },
      error: (err) => console.error('Erreur chargement messages', err)
    });
  }

  get filteredConversations() {
    if (!this.searchQuery) return this.conversations;
    const q = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv =>
      `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(q)
    );
  }

  // ============================================================
  // NOUVELLE DISCUSSION
  // ============================================================

  toggleNewConversation(): void {
    this.showNewConversation = !this.showNewConversation;
    this.newConversationQuery = '';
    this.newConversationResults = [];
  }

  searchNewConversation(): void {
    const q = this.newConversationQuery.trim();
    if (!q || q.length < 2) {
      this.newConversationResults = [];
      return;
    }
    this.isSearchingUsers = true;
    this.friendService.searchUsers(q).subscribe({
      next: (results: SearchUser[]) => {
        this.newConversationResults = results;
        this.isSearchingUsers = false;
      },
      error: () => { this.isSearchingUsers = false; }
    });
  }

  openConversationWith(user: SearchUser): void {
    if (user.isBlocked) {
      this.notificationService.showWarning('Impossible de discuter avec un utilisateur bloqué');
      return;
    }
    const existing = this.conversations.find(c => c.userId === user.id);
    if (existing) {
      this.selectConversation(existing);
    } else {
      const newConv: Conversation = {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        lastMessage: undefined,
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: false
      };
      this.conversations.unshift(newConv);
      this.selectConversation(newConv);
    }
    this.showNewConversation = false;
    this.newConversationQuery = '';
    this.newConversationResults = [];
  }

  // ============================================================
  // ENVOI DE MESSAGE
  // ============================================================

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact || this.isSending) return;
    this.isSending = true;
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: this.newMessage,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    this.scrollToBottom();
    this.chatService.sendMessage({
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: this.newMessage
    });
    this.newMessage = '';
    this.chatService.sendTyping(this.selectedContact.userId, false);
    setTimeout(() => this.isSending = false, 500);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact) return;
    const tempMsg: Message = {
      id: 'temp-emoji-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    this.scrollToBottom();
    this.chatService.sendMessage({
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji
    });
    this.showEmojiPicker = false;
  }

  onTyping(): void {
    if (!this.selectedContact) return;
    this.chatService.sendTyping(this.selectedContact.userId, true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedContact) this.chatService.sendTyping(this.selectedContact.userId, false);
    }, 1000);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  startChat(userId: string): void {
    const existing = this.conversations.find(c => c.userId === userId);
    if (existing) {
      this.selectConversation(existing);
      return;
    }
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        const friend = friends.find(f => f.friend?.id === userId)?.friend;
        if (friend) {
          const searchUser: SearchUser = {
            id: friend.id,
            firstName: friend.firstName,
            lastName: friend.lastName,
            email: friend.email,
            profilePicture: friend.profilePicture,
            isFriend: true
          };
          this.openConversationWith(searchUser);
        }
      },
      error: (err) => console.error('Erreur chargement amis', err)
    });
  }

  // ============================================================
  // FICHIERS / IMAGES / VOCAL
  // ============================================================

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
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
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        const fileUrl = this.getFileUrl(result.url);
        const tempMsg: Message = {
          id: 'temp-file-' + Date.now(),
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: type as 'image' | 'file',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          isRead: false,
          isDelivered: false,
          createdAt: new Date()
        };
        this.messages.push(tempMsg);
        this.scrollToBottom();
        this.chatService.sendMessage({
          receiverId: this.selectedContact!.userId,
          type: type as 'image' | 'file',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize
        });
        this.isSending = false;
      },
      error: () => {
        this.notificationService.showError('Erreur upload');
        this.isSending = false;
      }
    });
    event.target.value = '';
  }

  startCall(type: 'audio' | 'video'): void {
    if (!this.selectedContact) return;
    if (!this.selectedContact.isOnline) {
      this.notificationService.showWarning('Utilisateur hors ligne');
      return;
    }
    this.chatService.startCall(this.selectedContact.userId, type);
    this.notificationService.showInfo(`Appel ${type} démarré avec ${this.selectedContact.firstName}`);
  }

  startVoiceRecording(): void {
    this.notificationService.showInfo('Fonctionnalité de message vocal bientôt disponible');
  }

  // ============================================================
  // BLOCAGE
  // ============================================================

  blockUser(): void {
    if (!this.selectedContact) return;
    this.friendService.blockUser(this.selectedContact.userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Utilisateur bloqué');
        this.selectedContact!.isOnline = false;
      },
      error: (err) => this.notificationService.showError(err.error?.message || 'Erreur blocage')
    });
  }

  // ============================================================
  // ACTIONS SUR LES MESSAGES
  // ============================================================

  toggleMessageActions(msg: Message): void {
    if (msg.isDeleted) return;
    this.activeMessageId = this.activeMessageId === msg.id ? null : msg.id;
    this.activeReactionPickerId = null;
  }

  isOwnMessage(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  canEditMessage(msg: Message): boolean {
    if (!this.isOwnMessage(msg) || msg.isDeleted || msg.type !== 'text') return false;
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    return ageMs < 15 * 60 * 1000;
  }

  canDeleteMessage(msg: Message): boolean {
    return this.isOwnMessage(msg) && !msg.isDeleted;
  }

  toggleReactionPicker(msg: Message): void {
    this.activeReactionPickerId = this.activeReactionPickerId === msg.id ? null : msg.id;
  }

  myReaction(msg: Message): string | null {
    return msg.reactions?.find(r => r.userId === this.currentUserId)?.emoji || null;
  }

  toggleReaction(msg: Message, emoji: string): void {
    const mine = this.myReaction(msg);
    if (mine === emoji) {
      this.chatService.removeReaction(msg.id).subscribe(updated => this.applyMessageUpdate(updated));
    } else {
      this.chatService.reactToMessage(msg.id, emoji).subscribe(updated => this.applyMessageUpdate(updated));
    }
    this.activeReactionPickerId = null;
    this.activeMessageId = null;
  }

  groupedReactions(msg: Message): { emoji: string; count: number; mine: boolean }[] {
    if (!msg.reactions?.length) return [];
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const r of msg.reactions) {
      const entry = map.get(r.emoji) || { count: 0, mine: false };
      entry.count++;
      if (r.userId === this.currentUserId) entry.mine = true;
      map.set(r.emoji, entry);
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }));
  }

  startEdit(msg: Message): void {
    if (!this.canEditMessage(msg)) return;
    this.editingMessageId = msg.id;
    this.editContent = msg.content || '';
    this.activeMessageId = null;
    setTimeout(() => this.editInput?.nativeElement?.focus(), 50);
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editContent = '';
  }

  saveEdit(): void {
    if (!this.editingMessageId || !this.editContent.trim()) return;
    this.chatService.editMessage(this.editingMessageId, this.editContent.trim()).subscribe({
      next: (updated) => {
        this.applyMessageUpdate(updated);
        this.cancelEdit();
      },
      error: (err) => this.notificationService.showError(err.error?.message || 'Erreur modification')
    });
  }

  deleteMessage(msg: Message): void {
    if (!this.canDeleteMessage(msg)) return;
    if (!confirm('Supprimer ce message pour tout le monde ?')) return;
    this.chatService.deleteMessage(msg.id).subscribe({
      next: (updated) => this.applyMessageUpdate(updated),
      error: (err) => this.notificationService.showError(err.error?.message || 'Erreur suppression')
    });
    this.activeMessageId = null;
  }

  // ============================================================
  // TRANSFERT D'ARGENT
  // ============================================================

  openTransferPanel(): void {
    if (!this.selectedContact) return;
    this.showTransferPanel = true;
    this.transferAmount = null;
    this.activeMessageId = null;
  }

  closeTransferPanel(): void {
    this.showTransferPanel = false;
    this.transferAmount = null;
  }

  confirmTransfer(): void {
    if (!this.selectedContact || !this.transferAmount || this.transferAmount <= 0) return;
    const amount = this.transferAmount;
    const tempMsg: Message = {
      id: 'temp-money-' + Date.now(),
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'money',
      moneyTransfer: { amount, status: 'pending' },
      isRead: false,
      isDelivered: false,
      createdAt: new Date()
    };
    this.messages.push(tempMsg);
    this.scrollToBottom();
    this.chatService.sendMessage({
      receiverId: this.selectedContact.userId,
      type: 'money',
      moneyTransfer: { amount }
    });
    this.closeTransferPanel();
  }

  // ============================================================
  // HELPERS DE MISE À JOUR
  // ============================================================

  private applyMessageUpdate(updated: Message): void {
    const index = this.messages.findIndex(m => m.id === updated.id);
    if (index !== -1) {
      this.messages[index] = { ...this.messages[index], ...updated };
    }
  }

  private applyMessageDeleted(messageId: string): void {
    const index = this.messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.messages[index] = { ...this.messages[index], isDeleted: true, content: '', fileUrl: undefined };
    }
  }

  private closeAllPanels(): void {
    this.activeMessageId = null;
    this.activeReactionPickerId = null;
    this.editingMessageId = null;
    this.showTransferPanel = false;
    this.showEmojiPicker = false;
  }

  // ============================================================
  // HELPERS GENERAUX
  // ============================================================

  goBack(): void {
    this.router.navigate(['/user']);
  }

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  getAvatarColor(name: string): string {
    const colors = ['#667eea','#764ba2','#f093fb','#4facfe','#43e97b','#fa709a'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }
}