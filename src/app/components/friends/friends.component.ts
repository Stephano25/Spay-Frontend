import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-friends',
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
    MatTabsModule,
    MatDividerModule,
    MatMenuModule
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {
  showAddFriend = false;
  newFriendContact = '';
  
  friends = [
    { id: 1, name: 'Marie Rabe', email: 'marie.rabe@email.com', color: '#e91e63' },
    { id: 2, name: 'Pierre Randria', email: 'pierre.randria@email.com', color: '#4caf50' },
    { id: 3, name: 'Lovasoa Rakoto', email: 'lovasoa.rakoto@email.com', color: '#2196f3' },
    { id: 4, name: 'Soa Andriana', email: 'soa.andriana@email.com', color: '#ff9800' }
  ];

  pendingInvitations = [
    { id: 5, name: 'Hery Rajaonah', email: 'hery.rajaonah@email.com' },
    { id: 6, name: 'Mialy Randria', email: 'mialy.randria@email.com' }
  ];

  constructor() {}

  ngOnInit(): void {}

  scanQRCode(): void {
    window.location.href = '/scan-pay';
  }

  addFriend(): void {
    if (this.newFriendContact) {
      alert(`Invitation envoyée à ${this.newFriendContact}`);
      this.newFriendContact = '';
      this.showAddFriend = false;
    }
  }

  sendMoney(friend: any): void {
    alert(`Envoyer de l'argent à ${friend.name}`);
  }

  startChat(friend: any): void {
    window.location.href = '/chat';
  }

  removeFriend(friend: any): void {
    if (confirm(`Voulez-vous vraiment supprimer ${friend.name} de vos amis ?`)) {
      this.friends = this.friends.filter(f => f.id !== friend.id);
    }
  }

  acceptInvitation(invite: any): void {
    this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== invite.id);
    this.friends.push({
      id: invite.id,
      name: invite.name,
      email: invite.email,
      color: this.getRandomColor()
    });
  }

  declineInvitation(invite: any): void {
    this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== invite.id);
  }

  private getRandomColor(): string {
    const colors = ['#e91e63', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#ff5722'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}