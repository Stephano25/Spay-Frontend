import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-admin-withdraw',
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
    TranslatePipe
  ],
  templateUrl: './admin-withdraw.component.html',
  styleUrls: ['./admin-withdraw.component.css'],
})
export class AdminWithdrawComponent extends BaseComponent implements OnInit {
  users: any[] = [];
  admins: any[] = [];
  selectedUserId: string = '';
  amount: number = 0;
  description: string = '';
  isLoading = false;
  isSubmitting = false;
  isAdminWithdraw: boolean = false;
  targetAdminId: string | null = null;

  withdrawResult: {
    success: boolean;
    message: string;
    newBalance?: number;
  } | null = null;

  quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {super ();}

  override ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isAdminWithdraw = params['target'] === 'admin';
      this.targetAdminId = params['adminId'] || null;
      
      if (this.isAdminWithdraw) {
        this.loadAdmins();
      } else {
        this.loadUsers();
      }
    });
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

  loadAdmins(): void {
    this.isLoading = true;
    this.adminService.getAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.isLoading = false;
        
        if (this.targetAdminId) {
          const target = this.admins.find(a => a.id === this.targetAdminId);
          if (target) {
            this.selectedUserId = target.id;
          }
        }
      },
      error: (error) => {
        console.error('Erreur chargement admins:', error);
        this.notificationService.showError('Erreur lors du chargement des administrateurs');
        this.isLoading = false;
      },
    });
  }

  selectQuickAmount(amount: number): void {
    this.amount = amount;
  }

  onSubmit(): void {
    if (!this.selectedUserId) {
      this.notificationService.showError('Veuillez sélectionner un ' + (this.isAdminWithdraw ? 'administrateur' : 'utilisateur'));
      return;
    }

    if (!this.amount || this.amount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    const user = this.getSelectedUser();
    if (!user) {
      this.notificationService.showError('Utilisateur non trouvé');
      return;
    }

    if (user.balance < this.amount) {
      this.notificationService.showError(
        `Solde insuffisant. Solde actuel: ${this.formatAmount(user.balance)} Ar`,
      );
      return;
    }

    if (
      !confirm(
        `Confirmer le retrait de ${this.formatAmount(this.amount)} Ar du compte de ${user.firstName} ${user.lastName} ?`,
      )
    ) {
      return;
    }

    this.isSubmitting = true;
    this.withdrawResult = null;

    this.adminService
      .withdrawMoney(
        this.selectedUserId,
        this.amount,
        this.description || `Retrait administrateur`,
      )
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.withdrawResult = {
            success: true,
            message: `Retrait de ${this.formatAmount(this.amount)} Ar effectué avec succès`,
            newBalance: response.newBalance,
          };
          this.notificationService.showSuccess(this.withdrawResult.message);
          this.selectedUserId = '';
          this.amount = 0;
          this.description = '';
          
          if (this.isAdminWithdraw) {
            this.loadAdmins();
          } else {
            this.loadUsers();
          }
          
          setTimeout(() => (this.withdrawResult = null), 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.withdrawResult = {
            success: false,
            message: error?.error?.message || 'Erreur lors du retrait',
          };
          this.notificationService.showError(this.withdrawResult.message);
          setTimeout(() => (this.withdrawResult = null), 5000);
        },
      });
  }

  getSelectedUser(): any {
    if (this.isAdminWithdraw) {
      return this.admins.find((u) => u.id === this.selectedUserId);
    }
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