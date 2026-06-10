import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Message, Conversation } from '../../services/chat.service';
import { FriendService } from '../../services/friend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
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
  messages: Message[] = [];
  selectedContact: Conversation | null = null;
  currentUserId = '';
  newMessage = '';
  isTyping = false;
  typingTimeout: any;
  onlineFriends: any[] = [];
  searchQuery = '';
  showEmojiPicker = false;
  isSending = false;
  isVoiceSupported = 'MediaRecorder' in window || 'webkitSpeechRecognition' in window;

  private subscriptions: Subscription[] = [];

  emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '💀', '👻', '👽',
    '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌',
    '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜',
    '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️', '🗣️', '👤', '👥',
    '👣', '🧠', '🩸', '🩻', '💪', '🦵', '🦶', '👂', '🦻', '👃', '👀', '🧬', '🦷', '👅', '👄', '💋'
  ];

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.loadConversations();
    this.setupSocketListeners();
    this.loadOnlineFriends();
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe(convs => {
      this.conversations = convs.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });
  }

  loadOnlineFriends(): void {
    this.friendService.getFriends().subscribe(friends => {
      const accepted = friends.filter(f => f.status === 'accepted');
      this.onlineFriends = accepted.filter(f => f.friend?.isOnline);
    });
  }

  setupSocketListeners(): void {
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe(msg => msg && this.handleNewMessage(msg)),
      this.chatService.typing$.subscribe(data => {
        if (data && this.selectedContact && data.userId === this.selectedContact.userId) this.isTyping = data.isTyping;
      }),
      this.chatService.onlineStatus$.subscribe(data => {
        if (!data) return;
        const conv = this.conversations.find(c => c.userId === data.userId);
        if (conv) conv.isOnline = data.isOnline;
        this.loadOnlineFriends();
      })
    );
  }

  handleNewMessage(message: Message): void {
    if (this.selectedContact && message.senderId === this.selectedContact.userId) {
      this.messages.push(message);
      this.scrollToBottom();
      this.chatService.markAsRead(this.selectedContact.userId).subscribe();
    }
    const conv = this.conversations.find(c => c.userId === message.senderId);
    if (conv) {
      conv.lastMessage = { content: message.content || '', type: message.type, createdAt: message.createdAt };
      conv.lastMessageTime = message.createdAt;
      conv.unreadCount++;
    }
    this.conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }

  selectConversation(conv: Conversation): void {
    this.selectedContact = conv;
    this.messages = [];
    this.chatService.getMessages(conv.userId).subscribe(msgs => {
      this.messages = msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      this.scrollToBottom();
      this.chatService.markAsRead(conv.userId).subscribe();
      conv.unreadCount = 0;
    });
  }

  get filteredConversations() {
    if (!this.searchQuery) return this.conversations;
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv => 
      `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(query)
    );
  }

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
    if (existing) this.selectConversation(existing);
    else {
      this.friendService.getFriends().subscribe(friends => {
        const friend = friends.find(f => f.friend?.id === userId)?.friend;
        if (friend) {
          const newConv: Conversation = {
            userId: friend.id,
            firstName: friend.firstName,
            lastName: friend.lastName,
            profilePicture: friend.profilePicture,
            lastMessage: { content: '', type: 'text', createdAt: new Date() },
            lastMessageTime: new Date(),
            unreadCount: 0,
            isOnline: true
          };
          this.conversations.unshift(newConv);
          this.selectConversation(newConv);
        }
      });
    }
  }

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
      next: (result: { url: string; fileName: string; fileSize: number }) => {
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        const tempMsg: Message = {
          id: 'temp-file-' + Date.now(),
          senderId: this.currentUserId,
          receiverId: this.selectedContact!.userId,
          type: type as 'image' | 'file',
          fileUrl: result.url,
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
          fileUrl: result.url,
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

  sendMoney(): void {
    if (!this.selectedContact) return;
    const amount = prompt(`Montant à envoyer à ${this.selectedContact.firstName}:`, '1000');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const tempMsg: Message = {
        id: 'temp-money-' + Date.now(),
        senderId: this.currentUserId,
        receiverId: this.selectedContact.userId,
        type: 'money',
        moneyTransfer: { amount: Number(amount), status: 'pending' },
        isRead: false,
        isDelivered: false,
        createdAt: new Date()
      };
      this.messages.push(tempMsg);
      this.scrollToBottom();
      this.chatService.sendMessage({
        receiverId: this.selectedContact.userId,
        type: 'money',
        moneyTransfer: { amount: Number(amount) }
      });
    }
  }

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

  // 👉 Bouton de retour
  goBack(): void {
    this.router.navigate(['/user']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  getAvatarColor(name: string): string {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}