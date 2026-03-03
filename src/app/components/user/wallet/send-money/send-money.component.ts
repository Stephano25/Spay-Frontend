import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

// Services
import { WalletService } from '../../../../services/wallet.service';
import { FriendService } from '../../../../services/friend.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';

// Models
import { Friend } from '../../../../models/friend.model';
import { SendMoneyRequest } from '../../../../services/wallet.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-send-money',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './send-money.component.html',
  styleUrls: ['./send-money.component.css']
})
export class SendMoneyComponent implements OnInit {
  sendForm: FormGroup;
  friends: Friend[] = [];
  balance: number = 0;
  isLoading = false;
  isSubmitting = false;
  selectedFriend: Friend | null = null;
  step: 'friend' | 'amount' | 'confirm' = 'friend';

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.sendForm = this.fb.group({
      friendId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(100)]],
      description: ['', Validators.maxLength(100)],
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });
  }

  ngOnInit(): void {
    this.loadFriends();
    this.loadBalance();
    
    // Vérifier si un friendId est passé en paramètre
    this.route.queryParams.subscribe(params => {
      if (params['friendId']) {
        this.sendForm.patchValue({ friendId: params['friendId'] });
        setTimeout(() => this.selectFriend(), 500);
      }
    });
  }

  loadFriends(): void {
    this.friendService.getFriends().subscribe({
      next: (friends: Friend[]) => {
        this.friends = friends;
      },
      error: (error: any) => {
        console.error('Erreur chargement amis:', error);
      }
    });
  }

  loadBalance(): void {
    this.walletService.checkBalance().subscribe({
      next: (balance: number) => {
        this.balance = balance;
      },
      error: (error: any) => {
        console.error('Erreur chargement solde:', error);
      }
    });
  }

  selectFriend(): void {
    const friendId = this.sendForm.get('friendId')?.value;
    this.selectedFriend = this.friends.find(f => f.friend?.id === friendId) || null;
    if (this.selectedFriend) {
      this.step = 'amount';
    }
  }

  nextToConfirm(): void {
    if (this.sendForm.get('amount')?.valid) {
      this.step = 'confirm';
    }
  }

  sendMoney(): void {
    if (this.sendForm.invalid) return;

    this.isSubmitting = true;
    
    const data: SendMoneyRequest = {
      receiverId: this.sendForm.value.friendId,
      amount: this.sendForm.value.amount,
      description: this.sendForm.value.description || `Envoi à ${this.selectedFriend?.friend?.firstName}`,
      pin: this.sendForm.value.pin
    };

    this.walletService.sendMoney(data).subscribe({
      next: (transaction: any) => {
        this.notificationService.showSuccess(`Envoi de ${this.formatAmount(data.amount)} Ar réussi !`);
        setTimeout(() => {
          this.router.navigate(['/wallet']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Erreur envoi:', error);
        this.isSubmitting = false;
      }
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  goBack(): void {
    if (this.step === 'amount') {
      this.step = 'friend';
    } else if (this.step === 'confirm') {
      this.step = 'amount';
    } else {
      this.router.navigate(['/wallet']);
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
  }

  get remainingBalance(): number {
    const amount = this.sendForm.get('amount')?.value || 0;
    return this.balance - amount;
  }

  isBalanceSufficient(): boolean {
    return this.remainingBalance >= 0;
  }
}