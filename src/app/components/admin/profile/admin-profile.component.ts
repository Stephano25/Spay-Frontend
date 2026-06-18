import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
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

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAdminData();
    this.loadStats();
  }

  loadAdminData() {
    this.isLoading = true;
    this.authService.currentUser.subscribe({
      next: (user) => {
        if (user) {
          this.admin = user;
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