import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  conversations: any[] = [];
  selectedConversation: any;
  messages: any[] = [];
  newMessage = new FormControl('');
  currentUser: any;
  isTyping = false;
  typingTimeout: any;
  isCallActive = false;
  callType: 'video' | 'audio' = 'audio';
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  peerConnection: RTCPeerConnection | null = null;
  emojiPickerVisible = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user || { id: '1', firstName: 'Jean', lastName: 'Rakoto' };
    });
  }

  ngOnInit(): void {
    this.loadConversations();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }

  loadConversations(): void {
    // Simuler des conversations pour le test
    this.conversations = [
      {
        userId: '2',
        name: 'Marie Rabe',
        profilePicture: '',
        lastMessage: { content: 'Bonjour' },
        lastMessageTime: new Date()
      },
      {
        userId: '3',
        name: 'Pierre Randria',
        profilePicture: '',
        lastMessage: { content: 'Merci pour le paiement' },
        lastMessageTime: new Date()
      },
      {
        userId: '4',
        name: 'Lovasoa Rakoto',
        profilePicture: '',
        lastMessage: { content: 'Salut' },
        lastMessageTime: new Date()
      }
    ];
  }

  setupSocketListeners(): void {
    // À implémenter avec les vrais sockets
  }

  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.userId);
  }

  loadMessages(userId: string): void {
    // Simuler des messages
    this.messages = [
      {
        senderId: userId,
        type: 'text',
        content: 'Bonjour, comment ça va?',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        senderId: this.currentUser?.id,
        type: 'text',
        content: 'Ça va bien, merci!',
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        senderId: userId,
        type: 'text',
        content: 'Tu peux m\'envoyer 5000 Ar?',
        createdAt: new Date(Date.now() - 900000)
      }
    ];
    this.scrollToBottom();
  }

  sendMessage(): void {
    const content = this.newMessage.value?.trim();
    if (!content || !this.selectedConversation) return;

    const message = {
      senderId: this.currentUser?.id,
      type: 'text',
      content: content,
      createdAt: new Date()
    };

    this.messages.push(message);
    this.newMessage.setValue('');
    this.scrollToBottom();

    // Simuler une réponse après 1 seconde
    setTimeout(() => {
      const reply = {
        senderId: this.selectedConversation.userId,
        type: 'text',
        content: 'Message reçu!',
        createdAt: new Date()
      };
      this.messages.push(reply);
      this.scrollToBottom();
    }, 1000);
  }

  sendEmoji(emoji: any): void {
    if (!this.selectedConversation) return;

    const message = {
      senderId: this.currentUser?.id,
      type: 'emoji',
      emoji: '😊',
      createdAt: new Date()
    };

    this.messages.push(message);
    this.emojiPickerVisible = false;
    this.scrollToBottom();
  }

  onTyping(): void {
    if (!this.selectedConversation) return;

    clearTimeout(this.typingTimeout);
    this.isTyping = true;
    
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 1000);
  }

  sendFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 150 Mo)');
      return;
    }

    // Simuler l'upload
    const message = {
      senderId: this.currentUser?.id,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      createdAt: new Date()
    };

    this.messages.push(message);
    this.scrollToBottom();
  }

  startCall(type: 'video' | 'audio'): void {
    this.callType = type;
    this.isCallActive = true;

    // Simuler un appel
    setTimeout(() => {
      this.endCall();
      alert('Appel terminé');
    }, 5000);
  }

  endCall(): void {
    this.isCallActive = false;
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}