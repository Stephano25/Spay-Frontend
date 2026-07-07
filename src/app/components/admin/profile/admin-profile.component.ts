import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css'],
})
export class AdminProfileComponent implements OnInit {
  admin: any = null;
  stats: any = {};
  editMode = false;
  isLoading = true;
  isSaving = false;
  isSuperAdmin = false;

  // ✅ Pour l'augmentation du portefeuille
  showTopUpModal = false;
  topUpAmount: number = 0;
  topUpDescription: string = '';
  isTopUpSubmitting = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadAdminData();
    this.loadStats();
    const user = this.authService.getCurrentUser();
    this.isSuperAdmin = user?.role === 'super_admin';
  }

  loadAdminData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user) => {
        if (user) {
          this.admin = user;
          this.isSuperAdmin = user.role === 'super_admin';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      },
    });
  }

  loadStats() {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      },
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  saveProfile() {
    this.isSaving = true;
    const updatedAdmin = {
      firstName: this.admin.firstName,
      lastName: this.admin.lastName,
      email: this.admin.email,
      phoneNumber: this.admin.phoneNumber,
    };

    this.adminService.updateAdminProfile(updatedAdmin).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Profil mis à jour avec succès');
        this.editMode = false;
        this.isSaving = false;
        this.authService.updateCurrentUser(response);
      },
      error: (error) => {
        console.error('Erreur mise à jour:', error);
        this.notificationService.showError(
          'Erreur lors de la mise à jour du profil'
        );
        this.isSaving = false;
      },
    });
  }

  // ✅ OUVRIRE LE MODAL DE TOP-UP
  openTopUpModal() {
    this.topUpAmount = 0;
    this.topUpDescription = '';
    this.showTopUpModal = true;
  }

  // ✅ FERMER LE MODAL
  closeTopUpModal() {
    this.showTopUpModal = false;
    this.topUpAmount = 0;
    this.topUpDescription = '';
    this.isTopUpSubmitting = false;
  }

  // ✅ AUGMENTER LE PORTEFEUILLE DU SUPERADMIN
  topUpWallet() {
    if (!this.topUpAmount || this.topUpAmount < 100) {
      this.notificationService.showError('Le montant minimum est de 100 Ar');
      return;
    }

    if (!this.admin) {
      this.notificationService.showError('Administrateur non trouvé');
      return;
    }

    this.isTopUpSubmitting = true;

    // Utiliser le service Admin pour déposer sur lui-même
    this.adminService.depositMoney(
      this.admin.id,
      this.topUpAmount,
      this.topUpDescription || `Top-up portefeuille SuperAdmin`
    ).subscribe({
      next: (response) => {
        this.isTopUpSubmitting = false;
        this.notificationService.showSuccess(
          `💰 ${this.formatAmount(this.topUpAmount)} Ar ajoutés à votre portefeuille avec succès!`
        );
        // Mettre à jour le solde affiché
        if (this.admin) {
          this.admin.balance = response.newBalance || (this.admin.balance + this.topUpAmount);
          this.authService.updateCurrentUser(this.admin);
        }
        this.closeTopUpModal();
        this.loadAdminData();
      },
      error: (error) => {
        console.error('Erreur top-up:', error);
        this.isTopUpSubmitting = false;
        this.notificationService.showError(
          error?.error?.message || 'Erreur lors du top-up du portefeuille'
        );
      },
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    if (!this.admin) return '';
    return (
      (this.admin.firstName?.charAt(0) || '') +
      (this.admin.lastName?.charAt(0) || '')
    );
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + ' k';
    }
    return amount.toString();
  }
}