import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

import { WalletService } from '../../../../services/wallet.service';
import { FriendService } from '../../../../services/friend.service';
import { NotificationService } from '../../../../services/notification.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-send-money',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatSliderModule
  ],
  templateUrl: './send-money.component.html',
  styleUrls: ['./send-money.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInDown', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('0.4s ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class SendMoneyComponent implements OnInit {
  receiverId: string = '';
  receiverName: string = '';
  amount: number = 0;
  description: string = '';
  pin: string[] = ['', '', '', ''];
  
  isSubmitting: boolean = false;
  step: 'form' | 'confirm' | 'success' = 'form';
  balance: number = 0;
  friends: any[] = [];
  filteredFriends: any[] = [];
  
  showSuccess: boolean = false;
  
  // Montants rapides - DU MIN AU MAX
  amountPresets = [
    100, 500, 1000, 5000, 10000, 20000, 50000, 
    100000, 200000, 500000, 1000000, 2000000, 5000000, 
    10000000, 20000000, 50000000, 100000000
  ];
  
  searchQuery: string = '';
  
  // Constantes
  readonly MIN_AMOUNT = 100;
  readonly MAX_AMOUNT = 100000000; // 100 MILLIONS Ar

  constructor(
    private walletService: WalletService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBalance();
    this.loadFriends();
  }

  loadBalance() {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.balance = wallet.balance;
      },
      error: (err) => {
        console.error('Erreur chargement solde:', err);
      }
    });
  }

  loadFriends() {
    this.friendService.getFriends().subscribe({
      next: (friends) => {
        this.friends = friends;
        this.filteredFriends = friends;
      },
      error: (err) => {
        console.error('Erreur chargement amis:', err);
      }
    });
  }

  filterFriends() {
    if (!this.searchQuery.trim()) {
      this.filteredFriends = this.friends;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredFriends = this.friends.filter(friend => 
        friend.friend?.firstName?.toLowerCase().includes(query) ||
        friend.friend?.lastName?.toLowerCase().includes(query) ||
        friend.friend?.email?.toLowerCase().includes(query)
      );
    }
  }

  selectFriend(friend: any) {
    this.receiverId = friend.friend.id;
    this.receiverName = `${friend.friend.firstName} ${friend.friend.lastName}`;
    this.searchQuery = this.receiverName;
    this.filteredFriends = [];
  }

  sendMoney() {
    if (!this.receiverId || this.amount < this.MIN_AMOUNT) {
      this.notificationService.showError(`Montant minimum: ${this.formatAmount(this.MIN_AMOUNT)} Ar`);
      return;
    }
    
    if (this.amount > this.MAX_AMOUNT) {
      this.notificationService.showError(`Montant maximum: ${this.formatAmount(this.MAX_AMOUNT)} Ar`);
      return;
    }
    
    if (this.amount > this.balance) {
      this.notificationService.showError('Solde insuffisant');
      return;
    }
    
    this.step = 'confirm';
  }

  confirmSend() {
    this.isSubmitting = true;
    
    this.walletService.sendMoney({
      receiverId: this.receiverId,
      amount: this.amount,
      description: this.description || `Envoi à ${this.receiverName}`
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.step = 'success';
        this.showSuccess = true;
        
        setTimeout(() => {
          this.router.navigate(['/wallet']);
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur envoi:', err);
        this.notificationService.showError(err.error?.message || 'Erreur lors de l\'envoi');
        this.isSubmitting = false;
        this.step = 'form';
      }
    });
  }

  onPinInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    
    if (value.length === 1 && index < 3) {
      const nextInput = input.nextElementSibling;
      if (nextInput) nextInput.focus();
    }
  }

  goBack() {
    if (this.step === 'confirm') {
      this.step = 'form';
    } else if (this.step === 'success') {
      this.router.navigate(['/wallet']);
    } else {
      this.router.navigate(['/wallet']);
    }
  }

  reset() {
    this.receiverId = '';
    this.receiverName = '';
    this.amount = 0;
    this.description = '';
    this.pin = ['', '', '', ''];
    this.step = 'form';
    this.searchQuery = '';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  get remainingBalance(): number {
    return this.balance - this.amount;
  }

  isBalanceSufficient(): boolean {
    return this.remainingBalance >= 0;
  }

  getAmountIcon(): string {
    if (this.amount >= 10000000) return 'rocket_launch';
    if (this.amount >= 5000000) return 'star';
    if (this.amount >= 1000000) return 'trending_up';
    if (this.amount >= 100000) return 'savings';
    if (this.amount >= 10000) return 'paid';
    return 'arrow_upward';
  }

  get transactionId(): string {
    return 'SP' + Date.now();
  }
  
  // Formater avec suffixe (K, M)
  formatAmountWithSuffix(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + ' k';
    }
    return amount.toString();
  }
  
  // Vérifier si le montant est valide
  isAmountValid(): boolean {
    return this.amount >= this.MIN_AMOUNT && 
           this.amount <= this.MAX_AMOUNT && 
           this.amount <= this.balance;
  }
  
  // Obtenir le message d'erreur du montant
  getAmountErrorMessage(): string {
    if (this.amount < this.MIN_AMOUNT) {
      return `Minimum: ${this.formatAmount(this.MIN_AMOUNT)} Ar`;
    }
    if (this.amount > this.MAX_AMOUNT) {
      return `Maximum: ${this.formatAmount(this.MAX_AMOUNT)} Ar`;
    }
    if (this.amount > this.balance) {
      return 'Solde insuffisant';
    }
    return '';
  }
}