import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Message, Conversation } from '../../services/chat.service';
import { FriendService } from '../../services/friend.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedContact: Conversation | null = null;
  currentUserId = '';
  newMessage = '';
  isTyping = false;
  typingTimeout: any;
  onlineFriends: any[] = [];
  searchQuery = '';
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService, private friendService: FriendService, private authService: AuthService, private router: Router) {}

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

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact) return;
    const tempMsg: Message = {
      id: 'temp-' + Date.now(), senderId: this.currentUserId, receiverId: this.selectedContact.userId,
      type: 'text', content: this.newMessage, isRead: false, isDelivered: false, createdAt: new Date()
    };
    this.messages.push(tempMsg);
    this.scrollToBottom();
    this.chatService.sendMessage({ receiverId: this.selectedContact.userId, type: 'text', content: this.newMessage });
    this.newMessage = '';
    this.chatService.sendTyping(this.selectedContact.userId, false);
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
            userId: friend.id, firstName: friend.firstName, lastName: friend.lastName, profilePicture: friend.profilePicture,
            lastMessage: { content: '', type: 'text', createdAt: new Date() }, lastMessageTime: new Date(), unreadCount: 0, isOnline: true
          };
          this.conversations.unshift(newConv);
          this.selectConversation(newConv);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.typingTimeout);
  }

  getInitials(first: string, last: string): string { return (first?.charAt(0) || '') + (last?.charAt(0) || ''); }
  getAvatarColor(name: string): string {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}