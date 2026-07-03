// frontend/src/app/components/admin/admins/admin-admins.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule,
  ],
  templateUrl: './admin-admins.component.html',
  styleUrls: ['./admin-admins.component.css'],
})
export class AdminAdminsComponent implements OnInit {
  admins: any[] = [];
  isLoading = true;
  currentAdminId: string = '';
  isSuperAdmin = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentAdminId = user?.id || '';
    this.isSuperAdmin = user?.role === 'super_admin';
    
    // Vérifier que seul super_admin peut accéder
    if (!this.isSuperAdmin) {
      this.notificationService.showError('Accès réservé aux Super Administrateurs');
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.adminService.getAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement admins:', error);
        this.notificationService.showError('Erreur lors du chargement');
        this.isLoading = false;
      },
    });
  }

  // Bouton "Créer un Admin" - uniquement super_admin
  openCreateAdminDialog(): void {
    if (!this.isSuperAdmin) {
      this.notificationService.showError('Seul un Super Admin peut créer des administrateurs');
      return;
    }

    const email = prompt('Email du nouvel administrateur:');
    if (!email) return;
    
    const password = prompt('Mot de passe:');
    if (!password || password.length < 6) {
      this.notificationService.showError('Mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    const firstName = prompt('Prénom:');
    if (!firstName) return;
    
    const lastName = prompt('Nom:');
    if (!lastName) return;
    
    const role = confirm('Rôle Super Admin ?') ? 'super_admin' : 'admin';
    
    this.adminService.createAdmin({
      email,
      password,
      firstName,
      lastName,
      role
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Administrateur créé avec succès');
        this.loadAdmins();
      },
      error: (error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de la création');
      }
    });
  }

  toggleAdminStatus(admin: any): void {
    this.adminService.updateUserStatus(admin.id, !admin.isActive).subscribe({
      next: () => {
        admin.isActive = !admin.isActive;
        this.notificationService.showSuccess(`Admin ${admin.isActive ? 'activé' : 'désactivé'}`);
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la mise à jour');
      },
    });
  }

  deleteAdmin(admin: any): void {
    if (admin.id === this.currentAdminId) {
      this.notificationService.showWarning('Vous ne pouvez pas vous supprimer vous-même');
      return;
    }

    if (confirm(`Voulez-vous vraiment supprimer ${admin.firstName} ${admin.lastName} ?`)) {
      this.adminService.deleteAdmin(admin.id).subscribe({
        next: () => {
          this.admins = this.admins.filter((a) => a.id !== admin.id);
          this.notificationService.showSuccess('Admin supprimé');
        },
        error: (error) => {
          this.notificationService.showError('Erreur lors de la suppression');
        },
      });
    }
  }

  getInitials(admin: any): string {
    return (admin.firstName?.charAt(0) || '') + (admin.lastName?.charAt(0) || '');
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}