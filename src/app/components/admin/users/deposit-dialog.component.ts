// frontend/src/app/components/admin/users/deposit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-deposit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="dialog-header">
      <div class="dialog-icon">
        <mat-icon>account_balance_wallet</mat-icon>
      </div>
      <h2 class="dialog-title">Déposer de l'argent</h2>
      <button class="close-btn" (click)="onCancel()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Informations utilisateur -->
      <div class="user-card">
        <div class="user-avatar">
          {{ data.user.firstName?.charAt(0) }}{{ data.user.lastName?.charAt(0) }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ data.user.firstName }} {{ data.user.lastName }}</div>
          <div class="user-email">{{ data.user.email }}</div>
        </div>
        <div class="user-balance">
          <span class="balance-label">Solde actuel</span>
          <span class="balance-value">{{ data.user.balance | number }} Ar</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Montants rapides -->
      <div class="quick-amounts">
        <span class="quick-label">Montants rapides</span>
        <div class="amount-chips">
          <button 
            *ngFor="let preset of [1000, 5000, 10000, 25000, 50000, 100000]"
            class="amount-chip"
            [class.active]="amount === preset"
            (click)="amount = preset">
            {{ preset | number }} Ar
          </button>
        </div>
      </div>

      <!-- Formulaire -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Montant (Ar)</mat-label>
        <input 
          matInput 
          type="number" 
          [(ngModel)]="amount" 
          min="100" 
          placeholder="1000"
          (keyup)="onAmountChange()">
        <mat-icon matSuffix>attach_money</mat-icon>
        <mat-hint>Minimum 100 Ar</mat-hint>
        <mat-error *ngIf="amount && amount < 100">
          Le montant minimum est de 100 Ar
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optionnelle)</mat-label>
        <input 
          matInput 
          [(ngModel)]="description" 
          placeholder="Ex: Bonus, récompense, paiement...">
        <mat-icon matSuffix>notes</mat-icon>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button class="cancel-btn" (click)="onCancel()">
        <mat-icon>close</mat-icon>
        Annuler
      </button>
      <button
        mat-raised-button
        class="confirm-btn"
        [disabled]="!amount || amount < 100"
        (click)="onConfirm()">
        <mat-icon>add</mat-icon>
        Déposer {{ amount | number }} Ar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      position: relative;
      overflow: hidden;
    }

    .dialog-header::before {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      pointer-events: none;
    }

    .dialog-header::after {
      content: '';
      position: absolute;
      bottom: -40px;
      left: -40px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      pointer-events: none;
    }

    .dialog-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .dialog-icon mat-icon {
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
      color: white !important;
    }

    .dialog-title {
      flex: 1;
      font-family: 'Inter', 'Roboto', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0;
      position: relative;
      z-index: 2;
      letter-spacing: -0.01em;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.12);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
      z-index: 2;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: rotate(90deg);
    }

    .close-btn mat-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: white !important;
    }

    .dialog-content {
      padding: 24px !important;
      min-width: 420px;
      max-width: 100%;
      overflow-y: auto;
      max-height: 70vh;
    }

    .dialog-content::-webkit-scrollbar {
      width: 4px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: #d5d4e4;
      border-radius: 999px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--surface-2);
      border-radius: 12px;
      border: 0.5px solid var(--border);
      margin-bottom: 16px;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: var(--text);
      font-size: 0.9375rem;
    }

    .user-email {
      font-size: 0.8125rem;
      color: var(--text-3);
    }

    .user-balance {
      text-align: right;
    }

    .balance-label {
      display: block;
      font-size: 0.65rem;
      color: var(--text-4);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }

    .balance-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.125rem;
      font-weight: 700;
      color: #10b981;
    }

    .quick-amounts {
      margin: 16px 0 12px;
    }

    .quick-label {
      display: block;
      font-size: 0.72rem;
      color: var(--text-3);
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .amount-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .amount-chip {
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-2);
      background: var(--surface);
      color: var(--text-2);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: 'Inter', 'Roboto', sans-serif;
    }

    .amount-chip:hover {
      border-color: #7c3aed;
      color: #7c3aed;
      transform: translateY(-1px);
    }

    .amount-chip.active {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border-color: #7c3aed;
      color: white;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
    }

    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    ::ng-deep .mat-mdc-form-field-outline {
      border-radius: 10px !important;
    }

    .dialog-actions {
      padding: 16px 24px 20px !important;
      border-top: 0.5px solid var(--border);
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .cancel-btn {
      padding: 0 24px !important;
      border-radius: 999px !important;
      font-weight: 600 !important;
      color: var(--text-3) !important;
      transition: all 0.3s ease !important;
    }

    .cancel-btn:hover {
      background: var(--hover) !important;
    }

    .cancel-btn mat-icon {
      font-size: 18px !important;
      margin-right: 4px;
    }

    .confirm-btn {
      padding: 0 28px !important;
      border-radius: 999px !important;
      font-weight: 600 !important;
      background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
      color: white !important;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3) !important;
      transition: all 0.3s ease !important;
      min-height: 44px;
    }

    .confirm-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(124, 58, 237, 0.4) !important;
    }

    .confirm-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none !important;
    }

    .confirm-btn mat-icon {
      font-size: 18px !important;
      margin-right: 6px;
    }

    @media (max-width: 600px) {
      .dialog-content {
        min-width: auto;
        padding: 16px !important;
      }

      .user-card {
        flex-wrap: wrap;
      }

      .user-balance {
        text-align: left;
        width: 100%;
        padding-left: 64px;
      }

      .amount-chips {
        gap: 6px;
      }

      .amount-chip {
        padding: 5px 10px;
        font-size: 0.7rem;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class DepositDialogComponent {
  amount: number = 0;
  description: string = 'Dépôt administrateur';

  constructor(
    public dialogRef: MatDialogRef<DepositDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.amount && this.amount >= 100) {
      this.dialogRef.close({
        amount: this.amount,
        description: this.description || 'Dépôt administrateur'
      });
    }
  }

  onAmountChange(): void {
    // Validation supplémentaire si nécessaire
  }
}