// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService, Message, Conversation } from '../../services/chat.service';
import { FriendService, Friend, SearchUser } from '../../services/friend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfigService } from '../../services/config.service';
import { TranslationService } from '../../services/translation.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatTooltipModule, MatDividerModule, MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('editInput') editInput!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedContact: Conversation | null = null;
  currentUserId = '';
  newMessage = '';
  isTyping = false;
  typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldScrollToBottom = false;

  allFriends: Friend[] = [];
  onlineFriends: Friend[] = [];
  private friendsLoaded = false;
  private isReloadingFriends = false;
  private pendingOnlineStatus: { userId: string; isOnline: boolean }[] = [];

  searchQuery = '';
  showEmojiPicker = false;
  isSending = false;
  isVoiceSupported = typeof window !== 'undefined' && ('MediaRecorder' in window);

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

  incomingCall: { from: string; type: 'audio' | 'video' } | null = null;
  activeCall: { peerId: string; type: 'audio' | 'video'; status: 'calling' | 'active' } | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  peerConnection: RTCPeerConnection | null = null;
  isMuted = false;
  isCameraOff = false;

  isRecording = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: BlobPart[] = [];
  recordingTimer: any = null;
  recordingDuration = 0;

  emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
    '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏',
    '😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠',
    '😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥',
    '😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
    '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','👻','👽',
    '🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌',
    '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜',
    '🤎','🖤','🤍','💯','💢','💥','💫','💦','💨','💣','💬','👁️','🗣️','👤','👥'
  ];

  private subscriptions: Subscription[] = [];

  // ============================================================
  // AUDIO PLAYER - BANDE SONORE
  // ============================================================

  private audioPlayers: Map<string, HTMLAudioElement> = new Map();
  private audioPlayingMap: Map<string, boolean> = new Map();
  // ✅ Durée réelle préchargée dès l'affichage du message (évite le "0:00" avant lecture)
  private audioDurations: Map<string, number> = new Map();
  // ✅ Progression de lecture en % pour la barre de progression
  private audioProgress: Map<string, number> = new Map();

  // ============================================================
  // VIDEO PLAYER
  // ============================================================

  private videoPlayingMap: Map<string, boolean> = new Map();

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    console.log('👤 ChatComponent: currentUserId =', this.currentUserId);

    this.loadConversations();
    this.loadAllFriends(() => {
      this.processPendingOnlineStatus();
      this.chatService.requestOnlineUsers();
    });
    this.setupSocketListeners();

    this.route.queryParams.subscribe(params => {
      if (params['friendId']) {
        console.log('📩 Paramètre friendId reçu:', params['friendId']);
        setTimeout(() => this.openChatWithFriendId(params['friendId']), 800);
      }
    });

    setTimeout(() => this.forceReloadFriends(), 3000);

    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 ChatComponent: Langue changée en ${lang}`);
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.doScrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.endCall();
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    // Nettoyer les lecteurs audio
    this.audioPlayers.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioPlayers.clear();
    this.audioPlayingMap.clear();
    this.audioDurations.clear();
    this.audioProgress.clear();
    this.videoPlayingMap.clear();
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack(): void {
    this.router.navigate(['/user']);
  }

  goBackToConversations(): void {
    this.selectedContact = null;
    this.closeAllPanels();
    this.isTyping = false;
    this.cdr.detectChanges();
  }

  // ============================================================
  // CONVERSATIONS
  // ============================================================

  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (convs: Conversation[]) => {
        this.conversations = convs.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        this.updateConversationsOnlineStatus();
        this.removeDuplicateConversations();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('❌ Erreur chargement conversations:', err)
    });
  }

  loadAllFriends(callback?: () => void): void {
    if (this.isReloadingFriends) {
      callback?.();
      return;
    }
    this.isReloadingFriends = true;
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.allFriends = friends.filter(f => f.status === 'accepted');
        this.friendsLoaded = true;
        this.isReloadingFriends = false;
        this.updateOnlineFriends();
        this.updateConversationsOnlineStatus();
        this.cdr.detectChanges();
        callback?.();
        this.chatService.requestOnlineUsers();
      },
      error: (err: unknown) => {
        console.error('❌ Erreur chargement amis:', err);
        this.isReloadingFriends = false;
        callback?.();
      }
    });
  }

  forceReloadFriends(): void {
    this.isReloadingFriends = false;
    this.friendsLoaded = false;
    this.allFriends = [];
    this.onlineFriends = [];
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.allFriends = friends.filter(f => f.status === 'accepted');
        this.friendsLoaded = true;
        this.isReloadingFriends = false;
        this.updateOnlineFriends();
        this.updateConversationsOnlineStatus();
        this.processPendingOnlineStatus();
        this.cdr.detectChanges();
        this.chatService.requestOnlineUsers();
      },
      error: (err: unknown) => {
        console.error('❌ Erreur forceReloadFriends:', err);
        this.isReloadingFriends = false;
      }
    });
  }

  updateOnlineFriends(): void {
    if (!this.friendsLoaded) return;
    this.onlineFriends = this.allFriends.filter(f =>
      f.friend?.isOnline === true && f.friendId !== this.currentUserId
    );
    this.cdr.detectChanges();
  }

  updateConversationsOnlineStatus(): void {
    this.conversations.forEach(conv => {
      const f = this.allFriends.find(fr => fr.friendId === conv.userId || fr.friend?.id === conv.userId);
      if (f?.friend) conv.isOnline = f.friend.isOnline || false;
    });
    this.cdr.detectChanges();
  }

  private removeDuplicateConversations(): void {
    const seen = new Set<string>();
    this.conversations = this.conversations.filter(c => {
      if (seen.has(c.userId)) return false;
      seen.add(c.userId);
      return true;
    });
    this.cdr.detectChanges();
  }

  private processPendingOnlineStatus(): void {
    this.pendingOnlineStatus.forEach(d => this.handleOnlineStatus(d.userId, d.isOnline));
    this.pendingOnlineStatus = [];
  }

  private handleOnlineStatus(userId: string, isOnline: boolean): void {
    if (userId === this.currentUserId) return;
    if (!this.friendsLoaded) {
      this.pendingOnlineStatus.push({ userId, isOnline });
      return;
    }
    const f = this.allFriends.find(fr => fr.friendId === userId || fr.friend?.id === userId || fr.userId === userId);
    if (f?.friend) f.friend.isOnline = isOnline;
    this.updateOnlineFriends();
    const conv = this.conversations.find(c => c.userId === userId);
    if (conv) conv.isOnline = isOnline;
    if (this.selectedContact?.userId === userId) this.selectedContact.isOnline = isOnline;
    this.cdr.detectChanges();
  }

  get filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations;
    const q = this.searchQuery.toLowerCase();
    return this.conversations.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  }

  // ============================================================
  // SÉLECTION DE CONVERSATION
  // ============================================================

  selectConversation(conv: Conversation): void {
    console.log(`📩 Sélection de la conversation avec ${conv.firstName} ${conv.lastName}`);

    this.selectedContact = conv;
    this.messages = [];
    this.closeAllPanels();
    this.cdr.detectChanges();

    this.chatService.getMessages(conv.userId, 1, 200).subscribe({
      next: (msgs: Message[]) => {
        console.log(`📩 ${msgs.length} messages chargés depuis la base de données`);

        this.messages = msgs.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.shouldScrollToBottom = true;

        this.chatService.markAsRead(conv.userId).subscribe();
        conv.unreadCount = 0;

        const friend = this.allFriends.find(f => f.friendId === conv.userId);
        if (friend?.friend) {
          conv.isOnline = friend.friend.isOnline || false;
        }

        // ✅ Précharger la durée réelle de tous les messages vocaux de la conversation
        this.preloadAudioDurations();

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement des messages:', err);
        this.notificationService.showError('Erreur lors du chargement des messages');
      }
    });
  }

  startChat(userId: string): void {
    console.log(`💬 Démarrage d'une conversation avec ${userId}`);
    const existing = this.conversations.find(c => c.userId === userId);
    if (existing) {
      this.selectConversation(existing);
      return;
    }
    this.openChatWithFriendId(userId);
  }

  openChatWithFriendId(friendId: string): void {
    console.log(`🔍 Recherche de l'ami ${friendId}`);

    const existing = this.conversations.find(c => c.userId === friendId);
    if (existing) {
      this.selectConversation(existing);
      return;
    }

    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        console.log(`📋 ${friends.length} amis trouvés`);
        const f = friends.find(fr => fr.friendId === friendId || fr.friend?.id === friendId);

        if (f?.friend) {
          console.log(`✅ Ami trouvé: ${f.friend.firstName} ${f.friend.lastName}`);

          const newConv: Conversation = {
            userId: f.friend.id,
            firstName: f.friend.firstName,
            lastName: f.friend.lastName,
            profilePicture: f.friend.profilePicture,
            lastMessage: undefined,
            lastMessageTime: new Date(),
            unreadCount: 0,
            isOnline: f.friend.isOnline || false
          };

          this.conversations.unshift(newConv);
          this.selectConversation(newConv);
          this.showNewConversation = false;
          this.cdr.detectChanges();
        } else {
          console.warn(`⚠️ Ami non trouvé avec l'ID: ${friendId}`);
          this.notificationService.showWarning('Utilisateur non trouvé');
        }
      },
      error: (err: any) => {
        console.error('❌ Erreur lors de la récupération de l\'ami:', err);
        this.notificationService.showError('Erreur lors de la recherche');
      }
    });
  }

  // ============================================================
  // NOUVELLE CONVERSATION
  // ============================================================

  toggleNewConversation(): void {
    this.showNewConversation = !this.showNewConversation;
    this.newConversationQuery = '';
    this.newConversationResults = [];
    this.cdr.detectChanges();
  }

  searchNewConversation(): void {
    const q = this.newConversationQuery.trim();
    if (!q || q.length < 2) {
      this.newConversationResults = [];
      this.cdr.detectChanges();
      return;
    }
    this.isSearchingUsers = true;
    this.cdr.detectChanges();
    this.friendService.searchUsers(q).subscribe({
      next: (r: SearchUser[]) => {
        this.newConversationResults = r;
        this.isSearchingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error(err);
        this.isSearchingUsers = false;
        this.cdr.detectChanges();
      }
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
    this.cdr.detectChanges();
  }

  // ============================================================
  // ENVOI DE MESSAGES
  // ============================================================

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact || this.isSending) return;

    this.isSending = true;
    const content = this.newMessage.trim();

    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const tempMessage: Message = {
      id: tempId,
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: content,
      isRead: false,
      isDelivered: false,
      createdAt: new Date(),
      sender: {
        id: this.currentUserId,
        firstName: 'Moi',
        lastName: '',
      }
    };
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage({
      receiverId: this.selectedContact.userId,
      type: 'text',
      content: content
    });

    this.newMessage = '';
    this.chatService.sendTyping(this.selectedContact.userId, false);

    setTimeout(() => {
      this.isSending = false;
      this.cdr.detectChanges();
    }, 500);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact) return;

    const tempId = 'temp-emoji-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const tempMessage: Message = {
      id: tempId,
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'emoji',
      emoji: emoji,
      isRead: false,
      isDelivered: false,
      createdAt: new Date(),
      sender: {
        id: this.currentUserId,
        firstName: 'Moi',
        lastName: '',
      }
    };
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

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
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.selectedContact) {
        this.chatService.sendTyping(this.selectedContact.userId, false);
      }
    }, 1500);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private doScrollToBottom(): void {
    const el = this.messageContainer?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }

  // ============================================================
  // ÉVÉNEMENTS SOCKET - AVEC GESTION DES DOUBLONS
  // ============================================================

  setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => {
        if (msg) this.handleNewMessage(msg);
      })
    );

    this.subscriptions.push(
      this.chatService.typing$.subscribe(data => {
        if (data && this.selectedContact && data.userId === this.selectedContact.userId) {
          this.isTyping = data.isTyping;
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.push(
      this.chatService.onlineStatus$.subscribe(data => {
        if (data) this.handleOnlineStatus(data.userId, data.isOnline);
      })
    );

    this.subscriptions.push(
      this.chatService.messageEdited$.subscribe(msg => this.applyMessageUpdate(msg))
    );

    this.subscriptions.push(
      this.chatService.messageReaction$.subscribe(msg => this.applyMessageUpdate(msg))
    );

    this.subscriptions.push(
      this.chatService.messageDeleted$.subscribe(data => this.applyMessageDeleted(data.messageId))
    );

    this.subscriptions.push(
      this.chatService.messageBlocked$.subscribe(() => {
        this.notificationService.showWarning('Vous ne pouvez pas écrire à cet utilisateur');
      })
    );

    this.subscriptions.push(
      this.chatService.incomingCall$.subscribe(data => {
        if (data) this.handleIncomingCall(data);
      })
    );

    this.subscriptions.push(
      this.chatService.callAnswered$.subscribe(data => {
        if (data) this.handleCallAnswered(data);
      })
    );
  }

  /**
   * ✅ Gestion des nouveaux messages avec vérification des doublons
   */
  handleNewMessage(message: Message): void {
    console.log('📩 Nouveau message reçu:', message);

    // ✅ Vérifier si le message existe déjà (éviter les doublons)
    const exists = this.messages.some(m => m.id === message.id);
    if (exists) {
      console.log('⚠️ Message déjà présent, ignoré:', message.id);
      return;
    }

    // ✅ Si c'est pour la conversation actuelle
    if (this.selectedContact && message.senderId === this.selectedContact.userId) {
      this.messages.push(message);
      this.shouldScrollToBottom = true;
      this.cdr.detectChanges();
      this.chatService.markAsRead(this.selectedContact.userId).subscribe();

      // ✅ Précharger la durée si c'est un message vocal
      if (message.type === 'audio') {
        this.preloadAudioDurations();
      }
    }

    // ✅ Mettre à jour la conversation dans la liste
    let conv = this.conversations.find(c => c.userId === message.senderId);
    if (conv) {
      conv.lastMessage = {
        content: message.content || '',
        type: message.type,
        createdAt: message.createdAt
      };
      conv.lastMessageTime = message.createdAt;
      if (!this.selectedContact || this.selectedContact.userId !== message.senderId) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    } else if (message.sender) {
      this.conversations.unshift({
        userId: message.senderId,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profilePicture: message.sender.profilePicture,
        lastMessage: {
          content: message.content || '',
          type: message.type,
          createdAt: message.createdAt
        },
        lastMessageTime: message.createdAt,
        unreadCount: 1,
        isOnline: false
      });
    }

    this.conversations.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
    this.removeDuplicateConversations();
    this.cdr.detectChanges();
  }

  // ============================================================
  // FICHIERS - UPLOAD ET AFFICHAGE
  // ============================================================

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.cdr.detectChanges();
  }

  uploadFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedContact) return;

    if (file.size > 150 * 1024 * 1024) {
      this.notificationService.showError('Fichier trop volumineux (max 150 Mo)');
      return;
    }

    this.isSending = true;
    this.cdr.detectChanges();

    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const mime = file.type;
        let type: Message['type'] = 'file';
        if (mime.startsWith('image/')) type = 'image';
        else if (mime.startsWith('video/')) type = 'video';
        else if (mime.startsWith('audio/')) type = 'audio';

        const fileUrl = this.getFileUrl(result.url);
        const tempId = 'temp-file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

        const tempMessage: Message = {
          id: tempId,
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: type,
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          isRead: false,
          isDelivered: false,
          createdAt: new Date(),
          sender: {
            id: this.currentUserId,
            firstName: 'Moi',
            lastName: '',
          }
        };
        this.messages.push(tempMessage);
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();

        if (type === 'audio') {
          this.preloadAudioDurations();
        }

        this.chatService.sendMessage({
          receiverId: this.selectedContact!.userId,
          type: type,
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType
        });

        this.isSending = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('❌ Erreur upload:', err);
        this.notificationService.showError('Erreur upload');
        this.isSending = false;
        this.cdr.detectChanges();
      }
    });
    input.value = '';
  }

  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return this.configService.getFileUrl(fileUrl);
  }

  getFileType(msg: Message): 'image' | 'video' | 'audio' | 'document' {
    if (msg.type === 'image') return 'image';
    if (msg.type === 'video') return 'video';
    if (msg.type === 'audio') return 'audio';

    const url = (msg.fileUrl || '').toLowerCase();
    const name = (msg.fileName || '').toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(url) || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return 'image';
    if (/\.(mp4|webm|ogg|mov|avi)$/.test(url) || /\.(mp4|webm|ogg|mov|avi)$/.test(name)) return 'video';
    if (/\.(mp3|wav|ogg|aac|m4a|webm)$/.test(url) || /\.(mp3|wav|ogg|aac|m4a|webm)$/.test(name)) return 'audio';
    return 'document';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getFileIcon(fileName?: string): string {
    if (!fileName) return 'insert_drive_file';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const m: Record<string, string> = {
      pdf: 'picture_as_pdf',
      doc: 'description',
      docx: 'description',
      xls: 'table_chart',
      xlsx: 'table_chart',
      ppt: 'slideshow',
      pptx: 'slideshow',
      zip: 'folder_zip',
      rar: 'folder_zip',
      txt: 'text_snippet',
      csv: 'table_chart'
    };
    return m[ext] || 'insert_drive_file';
  }

  // ============================================================
  // DÉTECTION DE TYPES DE FICHIERS
  // ⚠️ CORRIGÉ : le type et le mimeType sont désormais prioritaires
  //    sur l'extension. C'est ce qui empêche un message vocal
  //    (type 'audio', fichier .webm) d'être aussi détecté comme
  //    une vidéo (.webm étant une extension ambiguë utilisée par
  //    les deux formats).
  // ============================================================

  /**
   * ✅ Vérifie si c'est un fichier audio
   */
  isAudioFile(msg: Message): boolean {
    if (!msg) return false;

    // Priorité absolue au type du message
    if (msg.type === 'audio') return true;
    if (msg.type === 'video' || msg.type === 'image') return false;

    // Ensuite le mimeType stocké lors de l'upload
    if (msg.mimeType) return msg.mimeType.startsWith('audio/');

    if (!msg.fileUrl) return false;
    const url = msg.fileUrl.toLowerCase();

    // Extensions non ambiguës (jamais utilisées pour la vidéo)
    if (/\.(mp3|wav|aac|m4a|flac|wma)$/i.test(url)) return true;

    // Cas particulier : les enregistrements vocaux générés par l'app
    // sont nommés "voice-<timestamp>.webm"
    if (/voice-\d+\.webm$/i.test(url)) return true;

    return false;
  }

  /**
   * ✅ Vérifie si c'est une image (par extension)
   */
  isImageFile(msg: Message): boolean {
    if (!msg || !msg.fileUrl) return false;

    const url = msg.fileUrl.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(url);
  }

  /**
   * ✅ Vérifie si c'est une vidéo
   */
  isVideoFile(msg: Message): boolean {
    if (!msg || !msg.fileUrl) return false;

    const url = msg.fileUrl.toLowerCase();
    return /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(url);
  }

  /**
   * ✅ Vérifie si c'est un document (par extension)
   */
  isDocumentFile(msg: Message): boolean {
    if (!msg || !msg.fileUrl) return false;

    const url = msg.fileUrl.toLowerCase();
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv)$/i.test(url);
  }

  // ============================================================
  // AUDIO PLAYER - BANDE SONORE
  // ============================================================

  isAudioPlaying(messageId: string): boolean {
    return this.audioPlayingMap.get(messageId) || false;
  }

  /**
   * ✅ Progression de lecture en pourcentage (0-100), pour la barre de progression
   */
  getAudioProgress(messageId: string): number {
    return this.audioProgress.get(messageId) || 0;
  }

  /**
   * ✅ Précharge la durée réelle de tous les messages vocaux visibles,
   *    sans les jouer, afin d'afficher la bonne durée dès l'ouverture du chat.
   */
  private preloadAudioDurations(): void {
    this.messages
      .filter(m => m.type === 'audio' && !!m.fileUrl && !this.audioDurations.has(m.id))
      .forEach(m => {
        const url = this.getFileUrl(m.fileUrl);
        if (!url) return;
        const probe = new Audio();
        probe.preload = 'metadata';
        probe.addEventListener('loadedmetadata', () => {
          if (probe.duration && isFinite(probe.duration) && !isNaN(probe.duration)) {
            this.audioDurations.set(m.id, probe.duration);
            this.cdr.detectChanges();
          }
        }, { once: true });
        probe.src = url;
      });
  }

  toggleAudioPlay(msg: Message): void {
    if (!msg.fileUrl) return;

    const fileUrl = this.getFileUrl(msg.fileUrl);
    let audio = this.audioPlayers.get(msg.id);

    if (!audio) {
      audio = new Audio(fileUrl);
      audio.preload = 'metadata';
      this.audioPlayers.set(msg.id, audio);

      audio.addEventListener('loadedmetadata', () => {
        if (audio!.duration && isFinite(audio!.duration) && !isNaN(audio!.duration)) {
          this.audioDurations.set(msg.id, audio!.duration);
          this.cdr.detectChanges();
        }
      });

      // ✅ Mise à jour de la barre de progression pendant la lecture
      audio.addEventListener('timeupdate', () => {
        if (audio!.duration && isFinite(audio!.duration) && !isNaN(audio!.duration)) {
          const pct = (audio!.currentTime / audio!.duration) * 100;
          this.audioProgress.set(msg.id, pct);
          this.cdr.detectChanges();
        }
      });

      audio.addEventListener('ended', () => {
        this.audioPlayingMap.set(msg.id, false);
        this.audioProgress.set(msg.id, 0);
        this.cdr.detectChanges();
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ Erreur audio:', e);
        this.audioPlayingMap.set(msg.id, false);
        this.cdr.detectChanges();
      });
    }

    // ✅ Un seul message vocal joué à la fois : on met en pause tous les autres
    this.audioPlayers.forEach((otherAudio, id) => {
      if (id !== msg.id && !otherAudio.paused) {
        otherAudio.pause();
        this.audioPlayingMap.set(id, false);
      }
    });

    if (this.audioPlayingMap.get(msg.id)) {
      audio.pause();
      this.audioPlayingMap.set(msg.id, false);
    } else {
      audio.play().catch(err => {
        console.error('❌ Erreur lecture audio:', err);
        this.audioPlayingMap.set(msg.id, false);
        this.notificationService.showError('Impossible de lire le fichier audio');
      });
      this.audioPlayingMap.set(msg.id, true);
    }

    this.cdr.detectChanges();
  }

  getAudioDuration(msg: Message): string {
    // ✅ On utilise en priorité la durée préchargée (disponible même avant lecture)
    const cached = this.audioDurations.get(msg.id);
    if (cached && isFinite(cached) && !isNaN(cached)) {
      return this.formatAudioDuration(cached);
    }

    const audio = this.audioPlayers.get(msg.id);
    if (audio && audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
      return this.formatAudioDuration(audio.duration);
    }

    return '0:00';
  }

  private formatAudioDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  downloadAudio(msg: Message): void {
    if (!msg.fileUrl) return;
    const fileUrl = this.getFileUrl(msg.fileUrl);
    const fileName = msg.fileName || 'audio.webm';

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================
  // MESSAGES VOCAUX - ENREGISTREMENT
  // ============================================================

  async toggleVoiceRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingDuration = 0;

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.sendAudioMessage(stream);
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.cdr.detectChanges();

      this.recordingTimer = setInterval(() => {
        this.recordingDuration++;
      }, 1000);

      this.notificationService.showInfo('🎤 Enregistrement en cours...');
    } catch (err: any) {
      console.error('❌ Erreur microphone:', err);
      this.notificationService.showError('Impossible d\'accéder au microphone');
      this.isRecording = false;
      this.cdr.detectChanges();
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.cdr.detectChanges();
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      this.notificationService.showInfo('⏹️ Enregistrement terminé');
    }
  }

  private sendAudioMessage(stream: MediaStream): void {
    stream.getTracks().forEach(t => t.stop());

    if (this.audioChunks.length === 0) {
      console.warn('⚠️ Aucune donnée audio');
      return;
    }

    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

    if (!this.selectedContact) return;

    console.log('🎤 Envoi audio, taille:', file.size);

    this.isSending = true;
    this.cdr.detectChanges();

    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const fileUrl = this.getFileUrl(result.url);
        const tempId = 'temp-audio-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

        this.messages.push({
          id: tempId,
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: 'audio',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          isRead: false,
          isDelivered: false,
          createdAt: new Date(),
          sender: {
            id: this.currentUserId,
            firstName: 'Moi',
            lastName: '',
          }
        });
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
        this.preloadAudioDurations();

        this.chatService.sendMessage({
          receiverId: this.selectedContact!.userId,
          type: 'audio',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType
        });

        this.isSending = false;
        this.cdr.detectChanges();
        this.notificationService.showSuccess('Message vocal envoyé');
      },
      error: (err: any) => {
        console.error('❌ Erreur audio:', err);
        this.notificationService.showError('Erreur lors de l\'envoi');
        this.isSending = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // VIDÉOS - STYLE FACEBOOK
  // ⚠️ CORRIGÉ : exclut explicitement les messages de type 'audio'
  //    et priorise le mimeType avant l'extension pour éviter les
  //    doublons avec les messages vocaux (.webm).
  // ============================================================

  isVideoMessage(msg: Message): boolean {
    if (!msg) return false;

    // Un message vocal n'est JAMAIS une vidéo, même si le fichier est en .webm
    if (msg.type === 'audio') return false;
    if (msg.type === 'video') return true;
    if (msg.type === 'image') return false;

    if (msg.mimeType) {
      if (msg.mimeType.startsWith('audio/')) return false;
      if (msg.mimeType.startsWith('video/')) return true;
    }

    if (msg.fileUrl) {
      const url = msg.fileUrl.toLowerCase();
      // Extensions non ambiguës
      if (/\.(mp4|mov|avi|mkv|flv|wmv)$/i.test(url)) return true;
      // .webm / .ogg sont ambigus (audio ET vidéo) : on ne les traite
      // comme vidéo que si ce n'est pas déjà identifié comme un fichier audio
      if (/\.(webm|ogg)$/i.test(url)) {
        return !this.isAudioFile(msg);
      }
    }

    return false;
  }

  isVideoPlaying(messageId: string): boolean {
    return this.videoPlayingMap.get(messageId) || false;
  }

  setVideoPlaying(messageId: string, isPlaying: boolean): void {
    this.videoPlayingMap.set(messageId, isPlaying);
    this.cdr.detectChanges();
  }

  getVideoThumbnail(msg: Message): string {
    if (!msg) return '';

    if (msg.thumbnail) {
      return this.getFileUrl(msg.thumbnail);
    }

    return '/assets/images/video-placeholder.png';
  }

  getVideoDuration(msg: Message): string {
    if (!msg || !msg.duration) {
      return '0:00';
    }

    const mins = Math.floor(msg.duration / 60);
    const secs = Math.floor(msg.duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  playVideo(msg: Message, event: Event): void {
    event.stopPropagation();

    if (!msg || !msg.fileUrl) return;

    const videoElement = event.target as HTMLVideoElement;
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play().catch(err => {
          console.error('❌ Erreur lecture vidéo:', err);
          this.notificationService.showError('Impossible de lire la vidéo');
        });
        this.setVideoPlaying(msg.id, true);
      } else {
        videoElement.pause();
        this.setVideoPlaying(msg.id, false);
      }
    }
  }

  downloadVideo(msg: Message): void {
    if (!msg || !msg.fileUrl) return;

    const fileUrl = this.getFileUrl(msg.fileUrl);
    const fileName = msg.fileName || 'video.mp4';

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================
  // ACTIONS SUR LES MESSAGES
  // ============================================================

  toggleMessageActions(msg: Message): void {
    if (msg.isDeleted) return;
    this.activeMessageId = this.activeMessageId === msg.id ? null : msg.id;
    this.activeReactionPickerId = null;
    this.cdr.detectChanges();
  }

  isOwnMessage(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  canEditMessage(msg: Message): boolean {
    if (!this.isOwnMessage(msg) || msg.isDeleted || msg.type !== 'text') return false;
    return Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
  }

  canDeleteMessage(msg: Message): boolean {
    return this.isOwnMessage(msg) && !msg.isDeleted;
  }

  toggleReactionPicker(msg: Message): void {
    this.activeReactionPickerId = this.activeReactionPickerId === msg.id ? null : msg.id;
    this.cdr.detectChanges();
  }

  myReaction(msg: Message): string | null {
    return msg.reactions?.find(r => r.userId === this.currentUserId)?.emoji || null;
  }

  toggleReaction(msg: Message, emoji: string): void {
    const mine = this.myReaction(msg);
    if (mine === emoji) {
      this.chatService.removeReaction(msg.id).subscribe((u: Message) => this.applyMessageUpdate(u));
    } else {
      this.chatService.reactToMessage(msg.id, emoji).subscribe((u: Message) => this.applyMessageUpdate(u));
    }
    this.activeReactionPickerId = null;
    this.activeMessageId = null;
    this.cdr.detectChanges();
  }

  groupedReactions(msg: Message): { emoji: string; count: number; mine: boolean }[] {
    if (!msg.reactions?.length) return [];
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const r of msg.reactions) {
      const e = map.get(r.emoji) || { count: 0, mine: false };
      e.count++;
      if (r.userId === this.currentUserId) e.mine = true;
      map.set(r.emoji, e);
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }));
  }

  startEdit(msg: Message): void {
    if (!this.canEditMessage(msg)) return;
    this.editingMessageId = msg.id;
    this.editContent = msg.content || '';
    this.activeMessageId = null;
    this.cdr.detectChanges();
    setTimeout(() => this.editInput?.nativeElement?.focus(), 50);
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editContent = '';
    this.cdr.detectChanges();
  }

  saveEdit(): void {
    if (!this.editingMessageId || !this.editContent.trim()) return;
    this.chatService.editMessage(this.editingMessageId, this.editContent.trim()).subscribe({
      next: (u: Message) => {
        this.applyMessageUpdate(u);
        this.cancelEdit();
      },
      error: (err: { error?: { message?: string } }) => {
        this.notificationService.showError(err.error?.message || 'Erreur modification');
      }
    });
  }

  deleteMessage(msg: Message): void {
    if (!this.canDeleteMessage(msg) || !confirm('Supprimer ce message ?')) return;
    this.chatService.deleteMessage(msg.id).subscribe({
      next: (u: Message) => this.applyMessageUpdate(u),
      error: (err: { error?: { message?: string } }) => {
        this.notificationService.showError(err.error?.message || 'Erreur suppression');
      }
    });
    this.activeMessageId = null;
    this.cdr.detectChanges();
  }

  private applyMessageUpdate(updated: Message): void {
    const i = this.messages.findIndex(m => m.id === updated.id);
    if (i !== -1) {
      this.messages[i] = { ...this.messages[i], ...updated };
      this.cdr.detectChanges();
    }
  }

  private applyMessageDeleted(messageId: string): void {
    const i = this.messages.findIndex(m => m.id === messageId);
    if (i !== -1) {
      this.messages[i] = {
        ...this.messages[i],
        isDeleted: true,
        content: '',
        fileUrl: undefined
      };
      this.cdr.detectChanges();
    }
  }

  private closeAllPanels(): void {
    this.activeMessageId = null;
    this.activeReactionPickerId = null;
    this.editingMessageId = null;
    this.showTransferPanel = false;
    this.showEmojiPicker = false;
    this.cdr.detectChanges();
  }

  closeOverlaysOnClick(): void {
    this.activeMessageId = null;
    this.activeReactionPickerId = null;
    if (this.showEmojiPicker) this.showEmojiPicker = false;
    this.cdr.detectChanges();
  }

  // ============================================================
  // TRANSFERT D'ARGENT
  // ============================================================

  openTransferPanel(): void {
    if (!this.selectedContact) return;
    this.showTransferPanel = true;
    this.transferAmount = null;
    this.activeMessageId = null;
    this.cdr.detectChanges();
  }

  closeTransferPanel(): void {
    this.showTransferPanel = false;
    this.transferAmount = null;
    this.cdr.detectChanges();
  }

  confirmTransfer(): void {
    if (!this.selectedContact || !this.transferAmount || this.transferAmount <= 0) return;
    const amount = this.transferAmount;
    const tempId = 'temp-money-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    this.messages.push({
      id: tempId,
      senderId: this.currentUserId,
      receiverId: this.selectedContact.userId,
      type: 'money',
      moneyTransfer: { amount, status: 'pending' },
      isRead: false,
      isDelivered: false,
      createdAt: new Date(),
      sender: {
        id: this.currentUserId,
        firstName: 'Moi',
        lastName: '',
      }
    });
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage({
      receiverId: this.selectedContact.userId,
      type: 'money',
      moneyTransfer: { amount }
    });
    this.closeTransferPanel();
  }

  // ============================================================
  // APPELS
  // ============================================================

  async startCall(type: 'audio' | 'video'): Promise<void> {
    if (!this.selectedContact) return;
    if (!this.selectedContact.isOnline) {
      this.notificationService.showWarning('Utilisateur hors ligne');
      return;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      this.activeCall = {
        peerId: this.selectedContact.userId,
        type,
        status: 'calling'
      };
      this.cdr.detectChanges();
      this.chatService.startCall(this.selectedContact.userId, type);
      this.setupPeerConnection();
    } catch (err: unknown) {
      console.error('❌ Erreur appel:', err);
      this.notificationService.showError('Impossible d\'accéder aux périphériques');
    }
  }

  handleIncomingCall(data: { from: string; type: 'audio' | 'video' }): void {
    this.incomingCall = data;
    this.cdr.detectChanges();
  }

  async acceptCall(): Promise<void> {
    if (!this.incomingCall) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.incomingCall.type === 'video'
      });
      this.activeCall = {
        peerId: this.incomingCall.from,
        type: this.incomingCall.type,
        status: 'active'
      };
      this.cdr.detectChanges();
      this.chatService.answerCall(this.incomingCall.from, true);
      this.incomingCall = null;
      this.setupPeerConnection();
    } catch (err: unknown) {
      console.error('❌ Erreur acceptation appel:', err);
      this.notificationService.showError('Impossible d\'accéder aux périphériques');
      this.rejectCall();
    }
  }

  rejectCall(): void {
    if (this.incomingCall) {
      this.chatService.answerCall(this.incomingCall.from, false);
      this.incomingCall = null;
      this.cdr.detectChanges();
    }
  }

  handleCallAnswered(data: { by: string; accepted: boolean }): void {
    if (data.accepted) {
      if (this.activeCall) this.activeCall.status = 'active';
    } else {
      this.notificationService.showInfo('Appel refusé');
      this.endCall();
    }
    this.cdr.detectChanges();
  }

  endCall(): void {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.remoteStream?.getTracks().forEach(t => t.stop());
    this.peerConnection?.close();
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.activeCall = null;
    this.incomingCall = null;
    this.isMuted = false;
    this.isCameraOff = false;
    this.cdr.detectChanges();
  }

  toggleMute(): void {
    if (!this.localStream) return;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(t => {
      t.enabled = !this.isMuted;
    });
    this.cdr.detectChanges();
  }

  toggleCamera(): void {
    if (!this.localStream) return;
    this.isCameraOff = !this.isCameraOff;
    this.localStream.getVideoTracks().forEach(t => {
      t.enabled = !this.isCameraOff;
    });
    this.cdr.detectChanges();
  }

  private setupPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
    this.peerConnection.ontrack = (e: RTCTrackEvent) => {
      this.remoteStream = e.streams[0];
      this.cdr.detectChanges();
    };
  }

  // ============================================================
  // BLOCAGE
  // ============================================================

  blockUser(): void {
    if (!this.selectedContact) return;
    this.friendService.blockUser(this.selectedContact.userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Utilisateur bloqué');
        if (this.selectedContact) {
          this.selectedContact.isOnline = false;
        }
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.notificationService.showError(err.error?.message || 'Erreur');
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getInitials(first?: string, last?: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  getAvatarColor(name?: string): string {
    const colors = ['#7c3aed', '#6d28d9', '#4f46e5', '#0891b2', '#0d9488', '#059669', '#d97706', '#dc2626', '#db2777', '#9333ea'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}