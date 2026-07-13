import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { WalletService } from '../../../../services/wallet.service';
import { Friend, FriendService } from '../../../../services/friend.service';
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
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from 'src/app/components/base.component';

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
    MatSliderModule,
    TranslatePipe
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
export class SendMoneyComponent extends BaseComponent implements OnInit {
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
  transactionId: string = '';
  
  amountPresets = [100, 500, 1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
  
  searchQuery: string = '';
  
  readonly MIN_AMOUNT = 100;
  readonly MAX_AMOUNT = 100000000;

  constructor(
    private walletService: WalletService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private router: Router
  ) {super();}

  override ngOnInit() {
    this.loadBalance();
    this.loadFriends();
  }

  // ✅ Chargement du solde
  loadBalance() {
    this.walletService.getBalance().subscribe({
      next: (data) => {
        this.balance = data.balance;
      },
      error: (err) => {
        console.error('Erreur chargement solde:', err);
        this.walletService.getWallet().subscribe({
          next: (wallet) => {
            this.balance = wallet.balance;
          },
          error: () => {}
        });
      }
    });
  }

  // ✅ Chargement des amis
  loadFriends() {
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.friends = friends;
        this.filteredFriends = friends;
      },
      error: (err) => {
        console.error('Erreur chargement amis:', err);
        this.friends = [];
        this.filteredFriends = [];
      }
    });
  }

  // ✅ Filtrage des amis
  filterFriends() {
    if (!this.searchQuery.trim()) {
      this.filteredFriends = this.friends;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredFriends = this.friends.filter(friend => {
        const firstName = friend.friend?.firstName?.toLowerCase() || '';
        const lastName = friend.friend?.lastName?.toLowerCase() || '';
        const email = friend.friend?.email?.toLowerCase() || '';
        return firstName.includes(query) || lastName.includes(query) || email.includes(query);
      });
    }
  }

  // ✅ Sélection d'un ami
  selectFriend(friend: any) {
    if (friend?.friend?.id) {
      this.receiverId = friend.friend.id;
      this.receiverName = `${friend.friend.firstName || ''} ${friend.friend.lastName || ''}`.trim();
      this.searchQuery = this.receiverName;
      this.filteredFriends = [];
    }
  }

  // ✅ Bouton "Envoyer" - fonctionne
  sendMoney() {
    if (!this.receiverId) {
      this.notificationService.showError('Veuillez sélectionner un destinataire');
      return;
    }
    
    if (this.amount < this.MIN_AMOUNT) {
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

  // ✅ Confirmation d'envoi
  confirmSend() {
    this.isSubmitting = true;
    
    this.walletService.transferMoney({
      receiverId: this.receiverId,
      amount: this.amount,
      description: this.description || `Envoi à ${this.receiverName}`
    }).subscribe({
      next: (response) => {
        this.transactionId = response.id || ('SP' + Date.now());
        this.isSubmitting = false;
        this.step = 'success';
        this.showSuccess = true;
        
        setTimeout(() => {
          this.router.navigate(['/user/wallet']).catch(() => {
            this.router.navigate(['/wallet']);
          });
        }, 3000);
      },
      error: (err: any) => {
        console.error('Erreur envoi:', err);
        this.notificationService.showError(err.error?.message || 'Erreur lors de l\'envoi');
        this.isSubmitting = false;
        this.step = 'form';
      }
    });
  }

  // ✅ Bouton "Retour" - fonctionne
  goBack() {
    if (this.step === 'confirm') {
      this.step = 'form';
    } else if (this.step === 'success') {
      this.router.navigate(['/user/wallet']).catch(() => {
        this.router.navigate(['/wallet']);
      });
    } else {
      this.router.navigate(['/user/wallet']).catch(() => {
        this.router.navigate(['/wallet']);
      });
    }
  }

  // ✅ Bouton "Réinitialiser" - fonctionne
  reset() {
    this.receiverId = '';
    this.receiverName = '';
    this.amount = 0;
    this.description = '';
    this.pin = ['', '', '', ''];
    this.step = 'form';
    this.searchQuery = '';
    this.showSuccess = false;
    this.transactionId = '';
  }

  // ✅ Boutons de montants prédéfinis
  selectAmount(amount: number) {
    this.amount = amount;
  }

  // ✅ Utilitaires
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  get remainingBalance(): number {
    return this.balance - (this.amount || 0);
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
  
  formatAmountWithSuffix(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + ' k';
    }
    return amount.toString();
  }
  
  isAmountValid(): boolean {
    return this.amount >= this.MIN_AMOUNT && 
           this.amount <= this.MAX_AMOUNT && 
           this.amount <= this.balance;
  }
  
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

  onPinInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    
    if (value.length === 1 && index < 3) {
      const nextInput = input.nextElementSibling;
      if (nextInput) nextInput.focus();
    }
  }
}