import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-admin-deposit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatToolbarModule,
  ],
  templateUrl: './admin-deposit.component.html',
  styleUrls: ['./admin-deposit.component.css'],
})
export class AdminDepositComponent implements OnInit {
  users: any[] = [];
  selectedUserId: string = '';
  amount: number = 0;
  description: string = '';
  isLoading = false;
  isSubmitting = false;

  depositResult: {
    success: boolean;
    message: string;
    newBalance?: number;
  } | null = null;

  quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
        this.isLoading = false;
      },
    });
  }

  selectQuickAmount(amount: number): void {
    this.amount = amount;
  }

  onSubmit(): void {
    if (!this.selectedUserId) {
      this.notificationService.showError('Veuillez sélectionner un utilisateur');
      return;
    }

    if (!this.amount || this.amount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    const user = this.users.find((u) => u.id === this.selectedUserId);
    if (!user) {
      this.notificationService.showError('Utilisateur non trouvé');
      return;
    }

    if (
      !confirm(
        `Confirmer le dépôt de ${this.formatAmount(this.amount)} Ar sur le compte de ${user.firstName} ${user.lastName} ?`,
      )
    ) {
      return;
    }

    this.isSubmitting = true;
    this.depositResult = null;

    this.adminService
      .depositMoney(
        this.selectedUserId,
        this.amount,
        this.description || `Dépôt administrateur`,
      )
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.depositResult = {
            success: true,
            message: `Dépôt de ${this.formatAmount(this.amount)} Ar effectué avec succès`,
            newBalance: response.newBalance,
          };
          this.notificationService.showSuccess(this.depositResult.message);
          this.selectedUserId = '';
          this.amount = 0;
          this.description = '';
          this.loadUsers();
          setTimeout(() => (this.depositResult = null), 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.depositResult = {
            success: false,
            message: error?.error?.message || 'Erreur lors du dépôt',
          };
          this.notificationService.showError(this.depositResult.message);
          setTimeout(() => (this.depositResult = null), 5000);
        },
      });
  }

  getSelectedUser(): any {
    return this.users.find((u) => u.id === this.selectedUserId);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount);
  }

  getUserInitials(user: any): string {
    return (user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '');
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}