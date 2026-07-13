// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService, Message, Conversation } from '../../services/chat.service';
import { FriendService, Friend, SearchUser } from '../../services/friend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfigService } from '../../services/config.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../base.component';

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
export class ChatComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewChecked {
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

  // 🔥 Propriétés pour l'enregistrement vocal
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

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute
  ) {super();}

  override ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.loadConversations();
    this.loadAllFriends(() => {
      this.processPendingOnlineStatus();
      this.chatService.requestOnlineUsers();
    });
    this.setupSocketListeners();
    this.route.queryParams.subscribe(params => {
      if (params['friendId']) setTimeout(() => this.openChatWithFriendId(params['friendId']), 800);
    });
    setTimeout(() => this.forceReloadFriends(), 3000);

    // ✅ S'abonner aux changements de langue
    this.subscriptions.push(
      this.translationService.language$.subscribe((lang) => {
        console.log(`🌐 ChatComponent: Langue changée en ${lang}`);
        // ✅ Mettre à jour les traductions dans le template
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) { this.doScrollToBottom(); this.shouldScrollToBottom = false; }
  }

  override ngOnDestroy(): void {
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
    super.ngOnDestroy();
  }

  // ✅ Méthode pour revenir à la liste des conversations (bouton retour mobile)
  goBackToConversations(): void {
    this.selectedContact = null;
    this.closeAllPanels();
    this.isTyping = false;
  }

  // File helpers
  getFileUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return this.configService.getFileUrl(fileUrl);
  }

  getFileType(msg: Message): 'image' | 'video' | 'audio' | 'document' {
    const url = (msg.fileUrl || '').toLowerCase();
    const name = (msg.fileName || '').toLowerCase();
    if (msg.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(url) || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return 'image';
    if (msg.type === 'video' || /\.(mp4|webm|ogg|mov|avi)$/.test(url) || /\.(mp4|webm|ogg|mov|avi)$/.test(name)) return 'video';
    if (msg.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a|webm)$/.test(url) || /\.(mp3|wav|ogg|aac|m4a|webm)$/.test(name)) return 'audio';
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
    const m: Record<string,string> = {
      pdf:'picture_as_pdf', doc:'description', docx:'description',
      xls:'table_chart', xlsx:'table_chart', ppt:'slideshow', pptx:'slideshow',
      zip:'folder_zip', rar:'folder_zip', txt:'text_snippet', csv:'table_chart'
    };
    return m[ext] || 'insert_drive_file';
  }

  // Loading
  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (convs: Conversation[]) => {
        this.conversations = convs.sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        this.updateConversationsOnlineStatus();
        this.removeDuplicateConversations();
      },
      error: (err: unknown) => console.error(err)
    });
  }

  loadAllFriends(callback?: () => void): void {
    if (this.isReloadingFriends) { callback?.(); return; }
    this.isReloadingFriends = true;
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.allFriends = friends.filter(f => f.status === 'accepted');
        this.friendsLoaded = true;
        this.isReloadingFriends = false;
        this.updateOnlineFriends();
        this.updateConversationsOnlineStatus();
        callback?.();
        this.chatService.requestOnlineUsers();
      },
      error: (err: unknown) => {
        console.error(err);
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
        this.chatService.requestOnlineUsers();
      },
      error: (err: unknown) => { console.error(err); this.isReloadingFriends = false; }
    });
  }

  updateOnlineFriends(): void {
    if (!this.friendsLoaded) return;
    this.onlineFriends = this.allFriends.filter(f =>
      f.friend?.isOnline === true && f.friendId !== this.currentUserId
    );
  }

  updateConversationsOnlineStatus(): void {
    this.conversations.forEach(conv => {
      const f = this.allFriends.find(fr => fr.friendId === conv.userId || fr.friend?.id === conv.userId);
      if (f?.friend) conv.isOnline = f.friend.isOnline || false;
    });
  }

  private removeDuplicateConversations(): void {
    const seen = new Set<string>();
    this.conversations = this.conversations.filter(c => { if (seen.has(c.userId)) return false; seen.add(c.userId); return true; });
  }

  private processPendingOnlineStatus(): void {
    this.pendingOnlineStatus.forEach(d => this.handleOnlineStatus(d.userId, d.isOnline));
    this.pendingOnlineStatus = [];
  }

  private handleOnlineStatus(userId: string, isOnline: boolean): void {
    if (userId === this.currentUserId) return;
    if (!this.friendsLoaded) { this.pendingOnlineStatus.push({ userId, isOnline }); return; }
    const f = this.allFriends.find(fr => fr.friendId === userId || fr.friend?.id === userId || fr.userId === userId);
    if (f?.friend) f.friend.isOnline = isOnline;
    this.updateOnlineFriends();
    const conv = this.conversations.find(c => c.userId === userId);
    if (conv) conv.isOnline = isOnline;
    if (this.selectedContact?.userId === userId) this.selectedContact.isOnline = isOnline;
  }

  // Socket listeners
  setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => { if (msg) this.handleNewMessage(msg); }),
      this.chatService.typing$.subscribe(data => {
        if (data && this.selectedContact && data.userId === this.selectedContact.userId) this.isTyping = data.isTyping;
      }),
      this.chatService.onlineStatus$.subscribe(data => { if (data) this.handleOnlineStatus(data.userId, data.isOnline); }),
      this.chatService.messageEdited$.subscribe(msg => this.applyMessageUpdate(msg)),
      this.chatService.messageReaction$.subscribe(msg => this.applyMessageUpdate(msg)),
      this.chatService.messageDeleted$.subscribe(data => this.applyMessageDeleted(data.messageId)),
      this.chatService.messageBlocked$.subscribe(() => this.notificationService.showWarning('Vous ne pouvez pas écrire à cet utilisateur')),
      this.chatService.incomingCall$.subscribe(data => { if (data) this.handleIncomingCall(data); }),
      this.chatService.callAnswered$.subscribe(data => { if (data) this.handleCallAnswered(data); })
    );
  }

  // Messages
  handleNewMessage(message: Message): void {
    if (this.selectedContact && message.senderId === this.selectedContact.userId) {
      if (!this.messages.find(m => m.id === message.id)) {
        this.messages.push(message);
        this.shouldScrollToBottom = true;
      }
      this.chatService.markAsRead(this.selectedContact.userId).subscribe();
    }
    let conv = this.conversations.find(c => c.userId === message.senderId);
    if (conv) {
      conv.lastMessage = { content: message.content || '', type: message.type, createdAt: message.createdAt };
      conv.lastMessageTime = message.createdAt;
      if (!this.selectedContact || this.selectedContact.userId !== message.senderId) conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else if (message.sender) {
      this.conversations.unshift({
        userId: message.senderId,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        profilePicture: message.sender.profilePicture,
        lastMessage: { content: message.content || '', type: message.type, createdAt: message.createdAt },
        lastMessageTime: message.createdAt,
        unreadCount: 1,
        isOnline: false
      });
    }
    this.conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    this.removeDuplicateConversations();
  }

  selectConversation(conv: Conversation): void {
    this.selectedContact = conv;
    this.messages = [];
    this.closeAllPanels();
    this.chatService.getMessages(conv.userId).subscribe({
      next: (msgs: Message[]) => {
        this.messages = msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.shouldScrollToBottom = true;
        this.chatService.markAsRead(conv.userId).subscribe();
        conv.unreadCount = 0;
      },
      error: (err: unknown) => console.error(err)
    });
  }

  get filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations;
    const q = this.searchQuery.toLowerCase();
    return this.conversations.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
  }

  // New conversation
  toggleNewConversation(): void {
    this.showNewConversation = !this.showNewConversation;
    this.newConversationQuery = '';
    this.newConversationResults = [];
  }

  searchNewConversation(): void {
    const q = this.newConversationQuery.trim();
    if (!q || q.length < 2) { this.newConversationResults = []; return; }
    this.isSearchingUsers = true;
    this.friendService.searchUsers(q).subscribe({
      next: (r: SearchUser[]) => { this.newConversationResults = r; this.isSearchingUsers = false; },
      error: (err: unknown) => { console.error(err); this.isSearchingUsers = false; }
    });
  }

  openConversationWith(user: SearchUser): void {
    if (user.isBlocked) { this.notificationService.showWarning('Impossible de discuter avec un utilisateur bloqué'); return; }
    const existing = this.conversations.find(c => c.userId === user.id);
    if (existing) { this.selectConversation(existing); }
    else {
      const newConv: Conversation = {
        userId: user.id, firstName: user.firstName, lastName: user.lastName,
        profilePicture: user.profilePicture, lastMessage: undefined,
        lastMessageTime: new Date(), unreadCount: 0, isOnline: false
      };
      this.conversations.unshift(newConv);
      this.selectConversation(newConv);
    }
    this.showNewConversation = false;
    this.newConversationQuery = '';
    this.newConversationResults = [];
  }

  openChatWithFriendId(friendId: string): void {
    const existing = this.conversations.find(c => c.userId === friendId);
    if (existing) { this.selectConversation(existing); return; }
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        const f = friends.find(fr => fr.friendId === friendId || fr.friend?.id === friendId);
        if (f?.friend) this.openConversationWith({ id: f.friend.id, firstName: f.friend.firstName, lastName: f.friend.lastName, email: f.friend.email, profilePicture: f.friend.profilePicture, isFriend: true });
      },
      error: (err: unknown) => console.error(err)
    });
  }

  // Send
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact || this.isSending) return;
    this.isSending = true;
    const content = this.newMessage.trim();
    this.messages.push({ id: 'temp-' + Date.now(), senderId: this.currentUserId, receiverId: this.selectedContact.userId, type: 'text', content, isRead: false, isDelivered: false, createdAt: new Date() });
    this.shouldScrollToBottom = true;
    this.chatService.sendMessage({ receiverId: this.selectedContact.userId, type: 'text', content });
    this.newMessage = '';
    this.chatService.sendTyping(this.selectedContact.userId, false);
    setTimeout(() => { this.isSending = false; }, 500);
  }

  sendEmoji(emoji: string): void {
    if (!this.selectedContact) return;
    this.messages.push({ id: 'temp-emoji-' + Date.now(), senderId: this.currentUserId, receiverId: this.selectedContact.userId, type: 'emoji', emoji, isRead: false, isDelivered: false, createdAt: new Date() });
    this.shouldScrollToBottom = true;
    this.chatService.sendMessage({ receiverId: this.selectedContact.userId, type: 'emoji', emoji });
    this.showEmojiPicker = false;
  }

  onTyping(): void {
    if (!this.selectedContact) return;
    this.chatService.sendTyping(this.selectedContact.userId, true);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => { if (this.selectedContact) this.chatService.sendTyping(this.selectedContact.userId, false); }, 1500);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  private doScrollToBottom(): void {
    const el = this.messageContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  startChat(userId: string): void {
    const existing = this.conversations.find(c => c.userId === userId);
    if (existing) { this.selectConversation(existing); return; }
    this.openChatWithFriendId(userId);
  }

  // Files
  toggleEmojiPicker(): void { this.showEmojiPicker = !this.showEmojiPicker; }
  uploadFile(): void { this.fileInput.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedContact) return;
    if (file.size > 150 * 1024 * 1024) { this.notificationService.showError('Fichier trop volumineux (max 150 Mo)'); return; }
    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const mime = file.type;
        let type: Message['type'] = 'file';
        if (mime.startsWith('image/')) type = 'image';
        else if (mime.startsWith('video/')) type = 'video';
        else if (mime.startsWith('audio/')) type = 'audio';
        const fileUrl = this.getFileUrl(result.url);
        this.messages.push({ id: 'temp-file-' + Date.now(), senderId: this.currentUserId, receiverId: this.selectedContact!.userId, type, fileUrl, fileName: result.fileName, fileSize: result.fileSize, isRead: false, isDelivered: false, createdAt: new Date() });
        this.shouldScrollToBottom = true;
        this.chatService.sendMessage({ receiverId: this.selectedContact!.userId, type, fileUrl, fileName: result.fileName, fileSize: result.fileSize });
        this.isSending = false;
      },
      error: (err: unknown) => { console.error(err); this.notificationService.showError('Erreur upload'); this.isSending = false; }
    });
    input.value = '';
  }

  // 🔥 VOICE RECORDING - Version complète
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
      
      this.recordingTimer = setInterval(() => {
        this.recordingDuration++;
      }, 1000);
      
      this.notificationService.showInfo('🎤 Enregistrement en cours...');
    } catch (err: any) {
      console.error('Erreur microphone:', err);
      this.notificationService.showError('Impossible d\'accéder au microphone');
      this.isRecording = false;
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
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
      console.warn('Aucune donnée audio');
      return;
    }
    
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    
    if (!this.selectedContact) return;
    
    console.log('🎤 Envoi audio, taille:', file.size);
    
    this.isSending = true;
    this.chatService.uploadFile(file).subscribe({
      next: (result) => {
        const fileUrl = this.getFileUrl(result.url);
        
        this.messages.push({
          id: 'temp-audio-' + Date.now(),
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: 'audio',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          isRead: false,
          isDelivered: false,
          createdAt: new Date()
        });
        this.shouldScrollToBottom = true;
        
        this.chatService.sendMessage({
          receiverId: this.selectedContact!.userId,
          type: 'audio',
          fileUrl: fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize
        });
        
        this.isSending = false;
        this.notificationService.showSuccess('Message vocal envoyé');
      },
      error: (err: any) => {
        console.error('Erreur audio:', err);
        this.notificationService.showError('Erreur lors de l\'envoi');
        this.isSending = false;
      }
    });
  }

  // Calls
  async startCall(type: 'audio' | 'video'): Promise<void> {
    if (!this.selectedContact) return;
    if (!this.selectedContact.isOnline) { this.notificationService.showWarning('Utilisateur hors ligne'); return; }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      this.activeCall = { peerId: this.selectedContact.userId, type, status: 'calling' };
      this.chatService.startCall(this.selectedContact.userId, type);
      this.setupPeerConnection();
    } catch (err: unknown) { console.error(err); this.notificationService.showError('Impossible d\'accéder aux périphériques'); }
  }

  handleIncomingCall(data: { from: string; type: 'audio' | 'video' }): void { this.incomingCall = data; }

  async acceptCall(): Promise<void> {
    if (!this.incomingCall) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: this.incomingCall.type === 'video' });
      this.activeCall = { peerId: this.incomingCall.from, type: this.incomingCall.type, status: 'active' };
      this.chatService.answerCall(this.incomingCall.from, true);
      this.incomingCall = null;
      this.setupPeerConnection();
    } catch (err: unknown) { console.error(err); this.notificationService.showError('Impossible d\'accéder aux périphériques'); this.rejectCall(); }
  }

  rejectCall(): void {
    if (this.incomingCall) { this.chatService.answerCall(this.incomingCall.from, false); this.incomingCall = null; }
  }

  handleCallAnswered(data: { by: string; accepted: boolean }): void {
    if (data.accepted) { if (this.activeCall) this.activeCall.status = 'active'; }
    else { this.notificationService.showInfo('Appel refusé'); this.endCall(); }
  }

  endCall(): void {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.remoteStream?.getTracks().forEach(t => t.stop());
    this.peerConnection?.close();
    this.localStream = null; this.remoteStream = null;
    this.peerConnection = null; this.activeCall = null;
    this.incomingCall = null; this.isMuted = false; this.isCameraOff = false;
  }

  toggleMute(): void {
    if (!this.localStream) return;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(t => { t.enabled = !this.isMuted; });
  }

  toggleCamera(): void {
    if (!this.localStream) return;
    this.isCameraOff = !this.isCameraOff;
    this.localStream.getVideoTracks().forEach(t => { t.enabled = !this.isCameraOff; });
  }

  private setupPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.localStream?.getTracks().forEach(track => this.peerConnection!.addTrack(track, this.localStream!));
    this.peerConnection.ontrack = (e: RTCTrackEvent) => { this.remoteStream = e.streams[0]; };
  }

  // Block
  blockUser(): void {
    if (!this.selectedContact) return;
    this.friendService.blockUser(this.selectedContact.userId).subscribe({
      next: () => { this.notificationService.showSuccess('Utilisateur bloqué'); if (this.selectedContact) this.selectedContact.isOnline = false; },
      error: (err: { error?: { message?: string } }) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
  }

  // Message actions
  toggleMessageActions(msg: Message): void {
    if (msg.isDeleted) return;
    this.activeMessageId = this.activeMessageId === msg.id ? null : msg.id;
    this.activeReactionPickerId = null;
  }

  isOwnMessage(msg: Message): boolean { return msg.senderId === this.currentUserId; }
  canEditMessage(msg: Message): boolean {
    if (!this.isOwnMessage(msg) || msg.isDeleted || msg.type !== 'text') return false;
    return Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
  }
  canDeleteMessage(msg: Message): boolean { return this.isOwnMessage(msg) && !msg.isDeleted; }
  toggleReactionPicker(msg: Message): void { this.activeReactionPickerId = this.activeReactionPickerId === msg.id ? null : msg.id; }
  myReaction(msg: Message): string | null { return msg.reactions?.find(r => r.userId === this.currentUserId)?.emoji || null; }

  toggleReaction(msg: Message, emoji: string): void {
    const mine = this.myReaction(msg);
    if (mine === emoji) { this.chatService.removeReaction(msg.id).subscribe((u: Message) => this.applyMessageUpdate(u)); }
    else { this.chatService.reactToMessage(msg.id, emoji).subscribe((u: Message) => this.applyMessageUpdate(u)); }
    this.activeReactionPickerId = null; this.activeMessageId = null;
  }

  groupedReactions(msg: Message): { emoji: string; count: number; mine: boolean }[] {
    if (!msg.reactions?.length) return [];
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const r of msg.reactions) {
      const e = map.get(r.emoji) || { count: 0, mine: false };
      e.count++; if (r.userId === this.currentUserId) e.mine = true; map.set(r.emoji, e);
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }));
  }

  startEdit(msg: Message): void {
    if (!this.canEditMessage(msg)) return;
    this.editingMessageId = msg.id; this.editContent = msg.content || ''; this.activeMessageId = null;
    setTimeout(() => this.editInput?.nativeElement?.focus(), 50);
  }
  cancelEdit(): void { this.editingMessageId = null; this.editContent = ''; }

  saveEdit(): void {
    if (!this.editingMessageId || !this.editContent.trim()) return;
    this.chatService.editMessage(this.editingMessageId, this.editContent.trim()).subscribe({
      next: (u: Message) => { this.applyMessageUpdate(u); this.cancelEdit(); },
      error: (err: { error?: { message?: string } }) => this.notificationService.showError(err.error?.message || 'Erreur modification')
    });
  }

  deleteMessage(msg: Message): void {
    if (!this.canDeleteMessage(msg) || !confirm('Supprimer ce message ?')) return;
    this.chatService.deleteMessage(msg.id).subscribe({
      next: (u: Message) => this.applyMessageUpdate(u),
      error: (err: { error?: { message?: string } }) => this.notificationService.showError(err.error?.message || 'Erreur')
    });
    this.activeMessageId = null;
  }

  // Transfer
  openTransferPanel(): void { if (!this.selectedContact) return; this.showTransferPanel = true; this.transferAmount = null; this.activeMessageId = null; }
  closeTransferPanel(): void { this.showTransferPanel = false; this.transferAmount = null; }

  confirmTransfer(): void {
    if (!this.selectedContact || !this.transferAmount || this.transferAmount <= 0) return;
    const amount = this.transferAmount;
    this.messages.push({ id: 'temp-money-' + Date.now(), senderId: this.currentUserId, receiverId: this.selectedContact.userId, type: 'money', moneyTransfer: { amount, status: 'pending' }, isRead: false, isDelivered: false, createdAt: new Date() });
    this.shouldScrollToBottom = true;
    this.chatService.sendMessage({ receiverId: this.selectedContact.userId, type: 'money', moneyTransfer: { amount } });
    this.closeTransferPanel();
  }

  // Helpers
  private applyMessageUpdate(updated: Message): void {
    const i = this.messages.findIndex(m => m.id === updated.id);
    if (i !== -1) this.messages[i] = { ...this.messages[i], ...updated };
  }
  private applyMessageDeleted(messageId: string): void {
    const i = this.messages.findIndex(m => m.id === messageId);
    if (i !== -1) this.messages[i] = { ...this.messages[i], isDeleted: true, content: '', fileUrl: undefined };
  }
  private closeAllPanels(): void {
    this.activeMessageId = null; this.activeReactionPickerId = null;
    this.editingMessageId = null; this.showTransferPanel = false; this.showEmojiPicker = false;
  }
  closeOverlaysOnClick(): void {
    this.activeMessageId = null; this.activeReactionPickerId = null;
    if (this.showEmojiPicker) this.showEmojiPicker = false;
  }

  goBack(): void { this.router.navigate(['/user']); }
  getInitials(first?: string, last?: string): string { return (first?.charAt(0) || '') + (last?.charAt(0) || ''); }
  getAvatarColor(name?: string): string {
    const c = ['#7c3aed','#6d28d9','#4f46e5','#0891b2','#0d9488','#059669','#d97706','#dc2626','#db2777','#9333ea'];
    let h = 0; for (let i = 0; i < (name||'').length; i++) h = (name||'').charCodeAt(i) + ((h << 5) - h);
    return c[Math.abs(h) % c.length];
  }
  formatAmount(amount: number): string { return new Intl.NumberFormat('fr-MG').format(amount || 0); }
  formatTime(date: Date | string): string { return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
}