import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../../services/wallet.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider'; // AJOUTER CET IMPORT

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
    MatDividerModule // AJOUTER ICI
  ],
  templateUrl: './send-money.component.html',
  styleUrls: ['./send-money.component.css']
})
export class SendMoneyComponent {
  receiverId: string = '';
  amount: number = 0;
  description: string = '';
  isSubmitting: boolean = false;
  step: 'form' | 'confirm' = 'form';
  balance: number = 0;

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {
    this.loadBalance();
  }

  loadBalance() {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.balance = wallet.balance;
        console.log('💰 Solde chargé dans SendMoney:', this.balance);
      },
      error: (err) => {
        console.error('Erreur chargement solde:', err);
      }
    });
  }

  sendMoney() {
    if (!this.receiverId || this.amount < 100) return;
    this.step = 'confirm';
  }

  confirmSend() {
    this.isSubmitting = true;
    
    this.walletService.sendMoney({
      receiverId: this.receiverId,
      amount: this.amount,
      description: this.description
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.router.navigate(['/wallet']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erreur envoi:', err);
        this.isSubmitting = false;
        this.step = 'form';
      }
    });
  }

  goBack() {
    if (this.step === 'confirm') {
      this.step = 'form';
    } else {
      this.router.navigate(['/wallet']);
    }
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
}