// frontend/src/app/components/admin/users/deposit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>💳 Déposer de l'argent</h2>
    <mat-dialog-content>
      <div class="user-info">
        <p><strong>Utilisateur :</strong> {{ data.user.firstName }} {{ data.user.lastName }}</p>
        <p><strong>Email :</strong> {{ data.user.email }}</p>
        <p><strong>Solde actuel :</strong> <span class="balance">{{ data.user.balance | number }} Ar</span></p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Montant (Ar)</mat-label>
        <input matInput type="number" [(ngModel)]="amount" min="100" placeholder="1000">
        <mat-hint>Minimum 100 Ar</mat-hint>
        <mat-error *ngIf="amount && amount < 100">Le montant minimum est de 100 Ar</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optionnelle)</mat-label>
        <input matInput [(ngModel)]="description" placeholder="Dépôt administrateur...">
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!amount || amount < 100"
        (click)="onConfirm()">
        <mat-icon>add</mat-icon>
        Déposer {{ amount | number }} Ar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    .user-info { margin-bottom: 16px; }
    .user-info p { margin: 6px 0; }
    .balance { color: #10b981; font-weight: 700; }
    mat-dialog-content { min-width: 350px; }
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
}