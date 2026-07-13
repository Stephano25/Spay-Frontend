// frontend/src/app/components/admin/users/deposit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../../base.component';

export interface DepositDialogData extends BaseComponent {
  user: any;
}

export interface DepositDialogResult extends BaseComponent {
  amount: number;
  description?: string;
}

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
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>account_balance_wallet</mat-icon>
      Dépôt pour {{ data.user.firstName }} {{ data.user.lastName }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="user-info">
        <div class="user-avatar">{{ getUserInitials() }}</div>
        <div class="user-details">
          <span class="user-name">{{ data.user.firstName }} {{ data.user.lastName }}</span>
          <span class="user-email">{{ data.user.email }}</span>
          <span class="user-balance">Solde actuel : {{ formatAmount(data.user.balance) }} Ar</span>
        </div>
      </div>

      <div class="quick-amounts">
        <span class="quick-label">Montants rapides</span>
        <div class="amount-chips">
          <button
            *ngFor="let presetAmount of quickAmounts"
            type="button"
            class="amount-chip"
            [class.active]="presetAmount === selectedAmount"
            (click)="selectAmount(presetAmount)">
            {{ formatAmount(presetAmount) }}
          </button>
        </div>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Montant (Ar)</mat-label>
        <input matInput type="number" [(ngModel)]="selectedAmount" min="100" placeholder="1000">
        <mat-icon matSuffix>attach_money</mat-icon>
        <mat-hint>Minimum 100 Ar</mat-hint>
        <mat-error *ngIf="selectedAmount && selectedAmount < 100">Le montant minimum est de 100 Ar</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optionnelle)</mat-label>
        <input matInput [(ngModel)]="description" placeholder="Ex: Bonus, récompense..." maxlength="200">
        <mat-hint align="end">{{ description ? description.length : 0 }}/200</mat-hint>
      </mat-form-field>

      <div class="preview" *ngIf="selectedAmount && selectedAmount >= 100">
        <div class="preview-row">
          <span>Nouveau solde</span>
          <span class="preview-new-balance">{{ formatAmount((data.user.balance || 0) + selectedAmount) }} Ar</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()" [disabled]="isSubmitting">
        Annuler
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!selectedAmount || selectedAmount < 100 || isSubmitting"
        (click)="onConfirm()">
        <mat-spinner diameter="20" *ngIf="isSubmitting"></mat-spinner>
        <span *ngIf="!isSubmitting">
          <mat-icon>add</mat-icon>
          Déposer {{ formatAmount(selectedAmount) }} Ar
        </span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text);
      padding: 20px 24px 12px;
      margin: 0;
      border-bottom: 0.5px solid var(--border);
    }

    .dialog-title mat-icon { color: var(--brand-1); }

    .dialog-content {
      padding: 20px 24px;
      max-width: 480px;
      min-width: 340px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      background: var(--brand-grad-soft);
      border-radius: var(--r-md);
      margin-bottom: 18px;
      border: 0.5px solid var(--border);
      flex-wrap: wrap;
    }

    .user-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: var(--brand-grad);
      display: flex; align-items: center; justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
      box-shadow: var(--shadow-brand);
    }

    .user-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 140px; }
    .user-name { font-weight: 600; color: var(--text); font-size: 0.9375rem; }
    .user-email { font-size: 0.8125rem; color: var(--text-3); word-break: break-all; }
    .user-balance { font-size: 0.8125rem; font-weight: 600; color: var(--success); font-family: var(--font-mono); }

    .quick-amounts { margin-bottom: 14px; }

    .quick-label {
      display: block;
      font-size: 0.72rem;
      color: var(--text-3);
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .amount-chips { display: flex; gap: 8px; flex-wrap: wrap; }

    .amount-chip {
      padding: 7px 13px;
      border-radius: 999px;
      border: 1px solid var(--border-2);
      background: var(--surface);
      color: var(--text-2);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--trans-base);
      font-family: var(--font-sans);
      min-height: 34px;
    }

    .amount-chip:hover { border-color: var(--brand-1); color: var(--brand-1); transform: translateY(-1px); }
    .amount-chip.active { background: var(--brand-grad); border-color: var(--brand-1); color: white; box-shadow: var(--shadow-brand); }

    .full-width { width: 100%; margin-bottom: 12px; }

    .preview {
      padding: 12px 16px;
      background: var(--surface-2);
      border-radius: var(--r-md);
      border: 0.5px solid var(--border);
      margin-top: 8px;
    }

    .preview-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-2); gap: 8px; }
    .preview-new-balance { font-weight: 700; color: var(--success); font-family: var(--font-mono); }

    .dialog-actions {
      padding: 12px 24px 20px;
      border-top: 0.5px solid var(--border);
      gap: 10px;
    }

    .dialog-actions button { border-radius: var(--r-pill) !important; min-width: 110px; min-height: 44px; }
    .dialog-actions button[color='primary'] { background: var(--brand-grad) !important; color: white !important; }
    .dialog-actions button[color='primary']:disabled { opacity: 0.5; cursor: not-allowed; }
    .dialog-actions button mat-spinner { display: inline-block; margin-right: 8px; }

    @media (max-width: 480px) {
      .dialog-content { padding: 16px; min-width: unset; max-width: 100%; }
      .dialog-title { padding: 16px; font-size: 1rem; }
      .dialog-actions { flex-direction: column-reverse; padding: 12px 16px 16px; }
      .dialog-actions button { width: 100%; min-width: unset; }
    }
  `]
})
export class DepositDialogComponent extends BaseComponent{
  selectedAmount: number = 0;
  description: string = '';
  isSubmitting: boolean = false;
  quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  constructor(
    public dialogRef: MatDialogRef<DepositDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepositDialogData,
  ) {super ();}

  getUserInitials(): string {
    const user = this.data.user;
    return (user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount || 0);
  }

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedAmount < 100) return;

    this.isSubmitting = true;
    this.dialogRef.close({
      amount: this.selectedAmount,
      description: this.description || `Dépôt administrateur`,
    });
  }
}